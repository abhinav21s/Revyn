// ============================================================
// GET /api/cases/sync
// Returns current DB state of a case for the UI polling loop.
// /api/recover already handles retry counter increments when
// payment.failed fires via the Razorpay SDK.
// This route also checks hosted payment link status for external
// payments (Razorpay hosted link paid outside our SDK).
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchPaymentLink } from "@/lib/razorpay";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("case_id");

    if (caseId) {
      const { data: c, error } = await supabaseAdmin
        .from("payment_cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (error || !c) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }

      // Already recovered — just return immediately
      if (c.status === "recovered") {
        return NextResponse.json({ recovered: true, status: "recovered", case: c });
      }

      // Extract hosted payment link ID if available
      let linkId = c.payment_link_id;
      if (!linkId && c.payment_link_url) {
        const match = c.payment_link_url.match(/plink_[a-zA-Z0-9]+/);
        if (match) {
          linkId = match[0];
        }
      }

      // If a hosted payment link exists, check whether it has been paid externally.
      // This covers the case where the customer paid via the rzp.io link in another tab.
      if (linkId) {
        const linkData = await fetchPaymentLink(linkId);
        if (linkData && (linkData.status === "paid" || (linkData.amount_paid && linkData.amount_paid > 0))) {
          const paidAmount = linkData.amount_paid || c.amount;
          const { data: updated } = await supabaseAdmin
            .from("payment_cases")
            .update({
              status: "recovered",
              recovered_at: new Date().toISOString(),
              recovered_amount: paidAmount,
              retry_count: Math.max((c.retry_count || 0) + 1, 1),
              payment_link_id: linkId,
            })
            .eq("id", caseId)
            .select()
            .single();

          await writeAuditLog({
            case_id: caseId,
            step: "RECOVERED",
            action: "razorpay_hosted_payment_verified",
            reason: `Payment verified directly from Razorpay hosted link API. Paid: ₹${paidAmount / 100}`,
            policy_rule: "RAZORPAY_API_SYNC",
            actor: "razorpay-api",
            metadata: {
              payment_link_id: linkId,
              status: linkData.status,
              amount_paid: paidAmount,
            },
          });

          return NextResponse.json({ recovered: true, status: "recovered", case: updated });
        }
      }

      // Fast path: Return the current DB state.
      // The retry_count is already up-to-date because /api/recover is called
      // immediately when payment.failed fires via the Razorpay SDK checkout.
      // The UI polling loop (checkSync) reads data.case.retry_count and
      // data.case.status to detect changes without needing a Razorpay API call.
      return NextResponse.json({ recovered: false, status: c.status, case: c });
    }

    // Bulk sync: check all non-recovered cases that have hosted payment links
    const { data: pendingCases } = await supabaseAdmin
      .from("payment_cases")
      .select("*")
      .neq("status", "recovered");

    let updatedCount = 0;
    if (pendingCases && pendingCases.length > 0) {
      for (const pCase of pendingCases) {
        let pLinkId = pCase.payment_link_id;
        if (!pLinkId && pCase.payment_link_url) {
          const match = pCase.payment_link_url.match(/plink_[a-zA-Z0-9]+/);
          if (match) pLinkId = match[0];
        }
        if (!pLinkId) continue;

        const link = await fetchPaymentLink(pLinkId);
        if (link && (link.status === "paid" || (link.amount_paid && link.amount_paid > 0))) {
          const paidAmt = link.amount_paid || pCase.amount;
          await supabaseAdmin
            .from("payment_cases")
            .update({
              status: "recovered",
              recovered_at: new Date().toISOString(),
              recovered_amount: paidAmt,
              retry_count: Math.max((pCase.retry_count || 0), 1),
              payment_link_id: pLinkId,
            })
            .eq("id", pCase.id);

          await writeAuditLog({
            case_id: pCase.id,
            step: "RECOVERED",
            action: "razorpay_hosted_payment_verified",
            reason: `Payment verified via Razorpay API sync. Paid: ₹${paidAmt / 100}`,
            policy_rule: "RAZORPAY_API_SYNC",
            actor: "razorpay-api",
            metadata: { payment_link_id: pLinkId, status: link.status },
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error) {
    console.error("[Sync API] Error:", error);
    return NextResponse.json({ error: "Sync failed", details: String(error) }, { status: 500 });
  }
}
