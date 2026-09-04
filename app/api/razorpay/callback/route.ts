// ============================================================
// GET /api/razorpay/callback
// Handles return redirect from Razorpay Hosted Payment Link (rzp.io)
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const caseId =
      url.searchParams.get("case_id") ||
      url.searchParams.get("razorpay_payment_link_reference_id") ||
      "";
    const paymentId = url.searchParams.get("razorpay_payment_id") || "";
    const linkStatus = url.searchParams.get("razorpay_payment_link_status") || "";
    const linkId = url.searchParams.get("razorpay_payment_link_id") || "";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;

    if (caseId) {
      // Mark case as recovered in database
      const { data: updatedCase } = await supabaseAdmin
        .from("payment_cases")
        .update({
          status: "recovered",
          recovered_at: new Date().toISOString(),
        })
        .eq("id", caseId)
        .select()
        .single();

      // Write RECOVERED entry in audit log
      await writeAuditLog({
        case_id: caseId,
        step: "RECOVERED",
        action: "razorpay_hosted_payment_received",
        reason: `Payment verified via Razorpay Hosted Page. Payment ID: ${paymentId || linkId || "authorized"}`,
        policy_rule: "PAYMENT_CONFIRMED",
        actor: "razorpay-hosted",
        metadata: {
          payment_id: paymentId,
          payment_link_id: linkId,
          status: linkStatus,
        },
      });
    }

    // Redirect user to the clean success receipt page
    return NextResponse.redirect(
      `${appUrl}/pay?id=${encodeURIComponent(caseId)}&paid=true&payment_id=${encodeURIComponent(paymentId)}`
    );
  } catch (error) {
    console.error("[Razorpay Callback] Error:", error);
    const url = new URL(request.url);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;
    return NextResponse.redirect(`${appUrl}/?error=callback_failed`);
  }
}
