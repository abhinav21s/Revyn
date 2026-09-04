// ============================================================
// GET /api/cases/sync
// Verifies live Razorpay Payment Link status against Razorpay API
// and automatically updates cases to RECOVERED when paid.
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

      if (c.status === "recovered") {
        return NextResponse.json({ recovered: true, status: "recovered", case: c });
      }

      if (c.payment_link_id) {
        const linkData = await fetchPaymentLink(c.payment_link_id);
        if (linkData && (linkData.status === "paid" || linkData.amount_paid > 0)) {
          const { data: updated } = await supabaseAdmin
            .from("payment_cases")
            .update({
              status: "recovered",
              recovered_at: new Date().toISOString(),
              recovered_amount: linkData.amount_paid || c.amount,
            })
            .eq("id", caseId)
            .select()
            .single();

          await writeAuditLog({
            case_id: caseId,
            step: "RECOVERED",
            action: "razorpay_hosted_payment_verified",
            reason: `Payment verified directly from Razorpay API. Paid: ₹${(linkData.amount_paid || c.amount) / 100}`,
            policy_rule: "RAZORPAY_API_SYNC",
            actor: "razorpay-api",
            metadata: {
              payment_link_id: c.payment_link_id,
              status: linkData.status,
              amount_paid: linkData.amount_paid,
            },
          });

          return NextResponse.json({ recovered: true, status: "recovered", case: updated });
        }
      }

      return NextResponse.json({ recovered: false, status: c.status, case: c });
    }

    // Sync all in-progress / pending cases with payment_link_id
    const { data: pendingCases } = await supabaseAdmin
      .from("payment_cases")
      .select("*")
      .neq("status", "recovered")
      .not("payment_link_id", "is", null);

    let updatedCount = 0;
    if (pendingCases && pendingCases.length > 0) {
      for (const pCase of pendingCases) {
        if (!pCase.payment_link_id) continue;
        const link = await fetchPaymentLink(pCase.payment_link_id);
        if (link && (link.status === "paid" || link.amount_paid > 0)) {
          await supabaseAdmin
            .from("payment_cases")
            .update({
              status: "recovered",
              recovered_at: new Date().toISOString(),
              recovered_amount: link.amount_paid || pCase.amount,
            })
            .eq("id", pCase.id);

          await writeAuditLog({
            case_id: pCase.id,
            step: "RECOVERED",
            action: "razorpay_hosted_payment_verified",
            reason: `Payment verified via Razorpay API sync. Paid: ₹${(link.amount_paid || pCase.amount) / 100}`,
            policy_rule: "RAZORPAY_API_SYNC",
            actor: "razorpay-api",
            metadata: { payment_link_id: pCase.payment_link_id, status: link.status },
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
