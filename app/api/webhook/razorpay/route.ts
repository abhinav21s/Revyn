// ============================================================
// POST /api/webhook/razorpay
// Handles Razorpay payment webhooks (Test Mode)
// Supports: payment_link.paid, payment.failed, payment_link.cancelled, payment_link.expired
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { writeAuditLog } from "@/lib/audit";
import { diagnosePayment } from "@/lib/diagnosis";
import { runPolicyEngine } from "@/lib/policy-engine";
import { createPaymentLink } from "@/lib/razorpay";
import type { CaseStatus } from "@/lib/types";

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

    // ── 1. Event: payment_link.paid or payment.captured (Recovery completed!) ──────
    if (eventType === "payment_link.paid" || eventType === "payment.captured" || eventType === "order.paid") {
      const paymentLinkId: string | undefined = event.payload?.payment_link?.entity?.id;
      const revynCaseId: string | undefined =
        event.payload?.payment_link?.entity?.notes?.revyn_case_id ||
        event.payload?.payment?.entity?.notes?.revyn_case_id;
      const paidAmount: number =
        event.payload?.payment?.entity?.amount ||
        event.payload?.payment_link?.entity?.amount ||
        0;

      let caseData: { id: string; retry_count?: number } | null = null;

      if (paymentLinkId) {
        const { data } = await supabaseAdmin
          .from("payment_cases")
          .select("id, retry_count")
          .eq("payment_link_id", paymentLinkId)
          .single();
        if (data) caseData = data;
      }

      if (!caseData && revynCaseId) {
        const { data } = await supabaseAdmin
          .from("payment_cases")
          .select("id, retry_count")
          .eq("id", revynCaseId)
          .single();
        if (data) caseData = data;
      }

      if (caseData) {
        await supabaseAdmin
          .from("payment_cases")
          .update({
            status: "recovered",
            recovered_amount: paidAmount,
            recovered_at: new Date().toISOString(),
            retry_count: Math.max((caseData.retry_count || 0), 1),
            ...(paymentLinkId && { payment_link_id: paymentLinkId }),
          })
          .eq("id", caseData.id);

        await writeAuditLog({
          case_id: caseData.id,
          step: "RECOVERED",
          action: "payment_link_paid",
          reason: `Payment verified via Razorpay webhook (${eventType}). Amount: ₹${paidAmount / 100}. Revenue recovered!`,
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

    // ── 2. Event: payment.failed (Real-time detection of failed payment) ───
    else if (eventType === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity) {
        const amount = paymentEntity.amount;
        const errorCode =
          paymentEntity.error_code || "BAD_REQUEST_PAYMENT_FAILED";
        const errorDescription =
          paymentEntity.error_description || "Payment failed via gateway";
        const customerEmail = paymentEntity.email || "customer@example.com";
        const customerContact = paymentEntity.contact || "";
        const revynCaseId = paymentEntity.notes?.revyn_case_id;

        // Check if this failure belongs to an existing case
        if (revynCaseId) {
          const { data: existingCase } = await supabaseAdmin
            .from("payment_cases")
            .select("*")
            .eq("id", revynCaseId)
            .single();

          if (existingCase) {
            const newRetryCount = (existingCase.retry_count || 0) + 1;
            if (newRetryCount >= 3) {
              await supabaseAdmin
                .from("payment_cases")
                .update({
                  status: "escalated",
                  retry_count: newRetryCount,
                  policy_action: "escalate_to_human",
                  policy_rule: "MAX_RETRY_LIMIT",
                  policy_reason: `Maximum retry limit of 3 reached (${newRetryCount} failed attempts). Escalated to human review queue.`,
                })
                .eq("id", existingCase.id);

              await writeAuditLog({
                case_id: existingCase.id,
                step: "DECIDE",
                action: "escalate_to_human",
                reason: `Payment attempt #${newRetryCount} failed via webhook (${errorCode}). Max retries reached — escalated to human.`,
                policy_rule: "MAX_RETRY_LIMIT",
                actor: "razorpay-webhook",
                metadata: { retry_count: newRetryCount, error_code: errorCode, error_description: errorDescription },
              });
            } else {
              await supabaseAdmin
                .from("payment_cases")
                .update({ retry_count: newRetryCount })
                .eq("id", existingCase.id);

              await writeAuditLog({
                case_id: existingCase.id,
                step: "EXECUTE",
                action: "payment_attempt_failed",
                reason: `Payment attempt #${newRetryCount} of 3 failed: ${errorCode} - ${errorDescription}`,
                policy_rule: "RETRY_COUNTER",
                actor: "razorpay-webhook",
                metadata: { retry_count: newRetryCount, error_code: errorCode, error_description: errorDescription },
              });
            }

            return NextResponse.json({ received: true });
          }
        }

        // Ingest new case into database if no matching existing case
        const { data: newCase } = await supabaseAdmin
          .from("payment_cases")
          .insert({
            merchant_id: "razorpay_live_webhook",
            customer_name: customerEmail.split("@")[0] || "Customer",
            customer_email: customerEmail,
            customer_phone: customerContact,
            amount: amount,
            currency: paymentEntity.currency || "INR",
            error_code: errorCode,
            error_message: errorDescription,
            status: "pending" as CaseStatus,
            retry_count: 0,
          })
          .select()
          .single();

        if (newCase) {
          await writeAuditLog({
            case_id: newCase.id,
            step: "DETECT",
            action: "webhook_failure_ingested",
            reason: `Ingested payment.failed webhook. Amount: ₹${amount / 100}. Error: ${errorCode}`,
            actor: "razorpay-webhook",
            metadata: { payment_id: paymentEntity.id },
          });

          // Run Diagnosis
          const diagnosis = await diagnosePayment(errorCode, errorDescription);

          // Run Policy Engine
          const policy = runPolicyEngine(
            {
              amount: newCase.amount,
              retry_count: 0,
              root_cause: diagnosis.root_cause,
              status: newCase.status,
            },
            false
          );

          let paymentLinkUrl: string | undefined;
          let paymentLinkId: string | undefined;
          let newStatus: CaseStatus = "in_progress";

          if (!policy.allowed) {
            newStatus =
              policy.action === "mark_unrecoverable"
                ? "unrecoverable"
                : "escalated";
          } else if (policy.action === "send_payment_link") {
            try {
              const link = await createPaymentLink({
                amount: newCase.amount,
                description: `Recovery for ${newCase.customer_name}`,
                customerName: newCase.customer_name,
                customerEmail: newCase.customer_email,
                customerPhone: newCase.customer_phone,
                referenceId: newCase.id,
              });
              paymentLinkUrl = link.short_url;
              paymentLinkId = link.id;
            } catch (err) {
              console.error("[Webhook] Link creation error:", err);
            }
          }

          // Update case
          await supabaseAdmin
            .from("payment_cases")
            .update({
              root_cause: diagnosis.root_cause,
              diagnosis_confidence: diagnosis.confidence,
              diagnosis_method: diagnosis.method,
              diagnosis_explanation: diagnosis.explanation,
              policy_action: policy.action,
              policy_reason: policy.reason,
              policy_rule: policy.policy_rule,
              status: newStatus,
              ...(paymentLinkUrl && { payment_link_url: paymentLinkUrl }),
              ...(paymentLinkId && { payment_link_id: paymentLinkId }),
            })
            .eq("id", newCase.id);
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
