// ============================================================
// GET /api/cases/sync
// Verifies live Razorpay Payment Link status against Razorpay API
// and automatically updates cases to RECOVERED when paid.
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchPaymentLink, fetchPaymentsForCase } from "@/lib/razorpay";
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

      let linkId = c.payment_link_id;
      if (!linkId && c.payment_link_url) {
        const match = c.payment_link_url.match(/plink_[a-zA-Z0-9]+/);
        if (match) {
          linkId = match[0];
        }
      }

      // 1. Check link status directly
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
            reason: `Payment verified directly from Razorpay API. Paid: ₹${paidAmount / 100}`,
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

      // 2. Check for payment attempts (failed/captured) from Razorpay Payments API
      const casePayments = await fetchPaymentsForCase(caseId, linkId);
      if (casePayments.length > 0) {
        const successfulPayment = casePayments.find((p: any) => p.status === "captured" || p.status === "authorized");
        if (successfulPayment) {
          const paidAmount = successfulPayment.amount || c.amount;
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
            action: "razorpay_payment_verified",
            reason: `Payment verified via Razorpay payment ID ${successfulPayment.id}. Paid: ₹${paidAmount / 100}`,
            policy_rule: "RAZORPAY_API_SYNC",
            actor: "razorpay-api",
          });

          return NextResponse.json({ recovered: true, status: "recovered", case: updated });
        }

        // Count failed payments for this case
        const failedPayments = casePayments.filter((p: any) => p.status === "failed");
        if (failedPayments.length > 0 && failedPayments.length > (c.retry_count || 0)) {
          const newRetryCount = failedPayments.length;
          if (newRetryCount >= 3) {
            const { data: updated } = await supabaseAdmin
              .from("payment_cases")
              .update({
                status: "escalated",
                retry_count: newRetryCount,
                policy_action: "escalate_to_human",
                policy_rule: "MAX_RETRY_LIMIT",
                policy_reason: `Maximum retry limit of 3 reached (${newRetryCount} failed attempts on Razorpay link). Escalated to human review.`,
              })
              .eq("id", caseId)
              .select()
              .single();

            await writeAuditLog({
              case_id: caseId,
              step: "DECIDE",
              action: "escalate_to_human",
              reason: `Payment attempt #${newRetryCount} failed on Razorpay link. Max retry limit reached (3/3) — case escalated to human review.`,
              policy_rule: "MAX_RETRY_LIMIT",
              actor: "revyn-executor",
            });

            return NextResponse.json({ recovered: false, status: "escalated", case: updated });
          } else {
            const { data: updated } = await supabaseAdmin
              .from("payment_cases")
              .update({ retry_count: newRetryCount })
              .eq("id", caseId)
              .select()
              .single();

            await writeAuditLog({
              case_id: caseId,
              step: "EXECUTE",
              action: "payment_attempt_failed",
              reason: `Payment attempt #${newRetryCount} of 3 failed on Razorpay link. Counter incremented.`,
              policy_rule: "RETRY_COUNTER",
              actor: "razorpay-gateway",
            });

            return NextResponse.json({ recovered: false, status: c.status, case: updated });
          }
        }
      }

      return NextResponse.json({ recovered: false, status: c.status, case: c });
    }

    // Sync all in-progress / pending cases with payment_link_id or payment_link_url
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
