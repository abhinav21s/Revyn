// ============================================================
// POST /api/webhook/razorpay
// Handles Razorpay payment webhooks (Test Mode)
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error("[Webhook] Invalid signature");
      await writeAuditLog({
        case_id: "webhook",
        step: "WEBHOOK",
        action: "signature_verification_failed",
        reason: "Razorpay webhook signature verification failed – request rejected",
        policy_rule: "WEBHOOK_SECURITY",
        actor: "razorpay-webhook",
        metadata: { signature },
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType: string = event.event;

    console.log(`[Webhook] Received event: ${eventType}`);

    if (eventType === "payment_link.paid") {
      const paymentLinkId: string = event.payload?.payment_link?.entity?.id;
      const paidAmount: number = event.payload?.payment?.entity?.amount;

      if (paymentLinkId) {
        // Find the case associated with this payment link
        const { data: caseData } = await supabaseAdmin
          .from("payment_cases")
          .select("id")
          .eq("payment_link_id", paymentLinkId)
          .single();

        if (caseData) {
          // Update case to recovered
          await supabaseAdmin
            .from("payment_cases")
            .update({
              status: "recovered",
              recovered_amount: paidAmount,
              recovered_at: new Date().toISOString(),
            })
            .eq("id", caseData.id);

          await writeAuditLog({
            case_id: caseData.id,
            step: "RECOVERED",
            action: "payment_link_paid",
            reason: `Payment link paid via Razorpay webhook. Amount: ₹${paidAmount / 100}. Revenue recovered!`,
            policy_rule: "WEBHOOK_RECOVERY",
            actor: "razorpay-webhook",
            metadata: {
              payment_link_id: paymentLinkId,
              paid_amount: paidAmount,
              event_type: eventType,
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
