// ============================================================
// POST /api/batch/run
// Runs the full recovery pipeline on a synthetic batch
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { diagnosePayment } from "@/lib/diagnosis";
import { runPolicyEngine } from "@/lib/policy-engine";
import { createPaymentLink } from "@/lib/razorpay";
import { writeAuditLog } from "@/lib/audit";
import { generateSyntheticBatch } from "@/lib/synthetic-data";
import type { PaymentCase, CaseStatus } from "@/lib/types";

// Check kill switch
async function isKillSwitchActive(): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "kill_switch")
    .single();
  return data?.value === "true";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const batchSize: number = body.batch_size || 20;
    const useSynthetic: boolean = body.use_synthetic !== false;

    // ── Check kill switch ────────────────────────────────────────
    const killActive = await isKillSwitchActive();
    if (killActive) {
      return NextResponse.json(
        {
          error: "Kill switch is active. All recovery actions are halted.",
          kill_switch: true,
        },
        { status: 503 }
      );
    }

    // ── Generate or use provided cases ──────────────────────────
    let rawCases = useSynthetic
      ? generateSyntheticBatch(Math.min(batchSize, 100))
      : (body.cases || []);

    if (!rawCases.length) {
      rawCases = generateSyntheticBatch(20);
    }

    // ── Insert cases into database ───────────────────────────────
    const { data: insertedCases, error: insertError } = await supabaseAdmin
      .from("payment_cases")
      .insert(rawCases)
      .select();

    if (insertError || !insertedCases) {
      console.error("[Batch] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create payment cases", details: insertError?.message },
        { status: 500 }
      );
    }

    const results = {
      processed: 0,
      smart_retry: 0,
      payment_link_sent: 0,
      escalated: 0,
      unrecoverable: 0,
      skipped_economic_floor: 0,
      errors: 0,
    };

    // ── Process all cases in parallel for maximum speed ─────────────
    const caseResults = await Promise.allSettled(
      (insertedCases as PaymentCase[]).map(async (paymentCase) => {
        results.processed++;

        // Step 1: Log detection
        await writeAuditLog({
          case_id: paymentCase.id,
          step: "DETECT",
          action: "payment_ingested",
          reason: `Payment case ingested. Error: ${paymentCase.error_code}. Amount: ₹${paymentCase.amount / 100}`,
          actor: "revyn-batch-runner",
          metadata: {
            error_code: paymentCase.error_code,
            error_message: paymentCase.error_message,
            amount: paymentCase.amount,
          },
        });

        // Step 2: Diagnose
        const diagnosis = await diagnosePayment(
          paymentCase.error_code,
          paymentCase.error_message
        );

        await writeAuditLog({
          case_id: paymentCase.id,
          step: "DIAGNOSE",
          action: "root_cause_identified",
          reason: diagnosis.explanation,
          actor: diagnosis.method === "llm_groq" ? "groq-llm" : "rule-engine",
          metadata: {
            root_cause: diagnosis.root_cause,
            confidence: diagnosis.confidence,
            method: diagnosis.method,
          },
        });

        // Step 3: Policy Engine decision
        const policy = runPolicyEngine(
          {
            amount: paymentCase.amount,
            retry_count: paymentCase.retry_count,
            root_cause: diagnosis.root_cause,
            status: paymentCase.status,
          },
          false // Kill switch already checked above
        );

        await writeAuditLog({
          case_id: paymentCase.id,
          step: "DECIDE",
          action: policy.action,
          reason: policy.reason,
          policy_rule: policy.policy_rule,
          actor: "policy-engine",
          metadata: {
            allowed: policy.allowed,
            retry_scheduled_for: policy.retry_scheduled_for,
          },
        });

        // Step 4: Execute action
        let newStatus: CaseStatus;
        let paymentLinkUrl: string | undefined;
        let paymentLinkId: string | undefined;

        if (!policy.allowed) {
          // Blocked by policy
          if (policy.action === "mark_unrecoverable") {
            newStatus = "unrecoverable";
            if (policy.policy_rule === "ECONOMIC_FLOOR") {
              results.skipped_economic_floor++;
            } else {
              results.unrecoverable++;
            }
          } else if (policy.action === "escalate_to_human") {
            newStatus = "escalated";
            results.escalated++;
          } else {
            newStatus = "halted";
          }
        } else {
          // Execute the allowed action
          if (policy.action === "smart_retry") {
            newStatus = "in_progress";
            results.smart_retry++;

            await writeAuditLog({
              case_id: paymentCase.id,
              step: "EXECUTE",
              action: "smart_retry_scheduled",
              reason: `Retry scheduled for ${policy.retry_scheduled_for}`,
              policy_rule: policy.policy_rule,
              actor: "revyn-executor",
              metadata: { retry_at: policy.retry_scheduled_for },
            });
          } else if (policy.action === "send_payment_link") {
            // Create Razorpay Payment Link
            try {
              const link = await createPaymentLink({
                amount: paymentCase.amount,
                description: `Payment recovery for ${paymentCase.customer_name} - Ref: ${paymentCase.id.slice(0, 8)}`,
                customerName: paymentCase.customer_name,
                customerEmail: paymentCase.customer_email,
                customerPhone: paymentCase.customer_phone,
                referenceId: paymentCase.id,
              });

              paymentLinkUrl = link.short_url;
              paymentLinkId = link.id;
              newStatus = "in_progress";
              results.payment_link_sent++;

              await writeAuditLog({
                case_id: paymentCase.id,
                step: "EXECUTE",
                action: "payment_link_created",
                reason: `Razorpay payment link created: ${link.short_url}`,
                policy_rule: policy.policy_rule,
                actor: "razorpay-api",
                metadata: { link_id: link.id, link_url: link.short_url },
              });
            } catch (linkError) {
              // Graceful failure – escalate if payment link creation fails
              console.error("[Batch] Payment link creation failed:", linkError);
              newStatus = "escalated";
              results.escalated++;

              await writeAuditLog({
                case_id: paymentCase.id,
                step: "EXECUTE",
                action: "payment_link_failed",
                reason: `Razorpay API error: ${linkError instanceof Error ? linkError.message : "Unknown"}. Escalating to human.`,
                policy_rule: "RAZORPAY_API_FAILURE",
                actor: "revyn-executor",
                metadata: {
                  error: String(linkError),
                  graceful_failure: true,
                },
              });
            }
          } else {
            newStatus = "in_progress";
          }
        }

        // Step 5: Update case in database
        const finalRetryCount = policy.action === "smart_retry"
          ? (paymentCase.retry_count || 0) + 1
          : (paymentCase.retry_count || 0);

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
            retry_count: finalRetryCount,
            ...(paymentLinkUrl && { payment_link_url: paymentLinkUrl }),
            ...(paymentLinkId && { payment_link_id: paymentLinkId }),
          })
          .eq("id", paymentCase.id);
      })
    );

    // Count errors from rejected promises
    for (const result of caseResults) {
      if (result.status === "rejected") {
        results.errors++;
        console.error("[Batch] Error processing case:", result.reason);

        // Best-effort audit log for failed case
        try {
          await writeAuditLog({
            case_id: "unknown",
            step: "ERROR",
            action: "processing_failed",
            reason: `Unexpected error: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
            actor: "revyn-batch-runner",
            metadata: { error: String(result.reason) },
          });
        } catch { /* silent */ }
      }
    }

    return NextResponse.json({
      success: true,
      batch_size: insertedCases.length,
      results,
    });
  } catch (error) {
    console.error("[Batch] Fatal error:", error);
    return NextResponse.json(
      { error: "Batch processing failed", details: String(error) },
      { status: 500 }
    );
  }
}
