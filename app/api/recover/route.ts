// ============================================================
// POST /api/recover
// Execute manual recovery action or simulate payment completion
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runPolicyEngine } from "@/lib/policy-engine";
import { createPaymentLink } from "@/lib/razorpay";
import { writeAuditLog } from "@/lib/audit";
import type { PaymentCase } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { case_id, action_override, simulate_recovery } = body;

    if (!case_id) {
      return NextResponse.json({ error: "case_id is required" }, { status: 400 });
    }

    // Fetch case from Supabase
    const { data: paymentCase, error: fetchErr } = await supabaseAdmin
      .from("payment_cases")
      .select("*")
      .eq("id", case_id)
      .single();

    if (fetchErr || !paymentCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // If simulate_recovery is true (Demo helper to simulate customer paying the link)
    if (simulate_recovery) {
      const recoveredAmount = paymentCase.amount;
      await supabaseAdmin
        .from("payment_cases")
        .update({
          status: "recovered",
          recovered_amount: recoveredAmount,
          recovered_at: new Date().toISOString(),
        })
        .eq("id", case_id);

      await writeAuditLog({
        case_id: case_id,
        step: "RECOVERED",
        action: "manual_simulation_paid",
        reason: `Payment simulated as paid by operator. Recovered ₹${recoveredAmount / 100}.`,
        policy_rule: "MANUAL_SIMULATION",
        actor: "operator",
        metadata: { amount: recoveredAmount },
      });

      return NextResponse.json({
        success: true,
        message: "Payment marked as recovered successfully",
        recovered_amount: recoveredAmount,
      });
    }

    // Check kill switch
    const { data: killSetting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "kill_switch")
      .single();

    const isKillActive = killSetting?.value === "true";

    const policy = runPolicyEngine(
      {
        amount: paymentCase.amount,
        retry_count: paymentCase.retry_count,
        root_cause: paymentCase.root_cause,
        status: paymentCase.status,
      },
      isKillActive
    );

    await writeAuditLog({
      case_id: case_id,
      step: "DECIDE",
      action: policy.action,
      reason: policy.reason,
      policy_rule: policy.policy_rule,
      actor: "policy-engine",
      metadata: { action_override },
    });

    if (!policy.allowed) {
      const newStatus =
        policy.action === "mark_unrecoverable"
          ? "unrecoverable"
          : policy.action === "escalate_to_human"
          ? "escalated"
          : "halted";

      await supabaseAdmin
        .from("payment_cases")
        .update({
          status: newStatus,
          policy_action: policy.action,
          policy_reason: policy.reason,
          policy_rule: policy.policy_rule,
        })
        .eq("id", case_id);

      return NextResponse.json({
        success: false,
        action: policy.action,
        reason: policy.reason,
        status: newStatus,
      });
    }

    // Execute allowed action
    let paymentLinkUrl: string | undefined;
    let paymentLinkId: string | undefined;

    if (policy.action === "send_payment_link") {
      try {
        const link = await createPaymentLink({
          amount: paymentCase.amount,
          description: `Revyn Recovery: ${paymentCase.customer_name}`,
          customerName: paymentCase.customer_name,
          customerEmail: paymentCase.customer_email,
          customerPhone: paymentCase.customer_phone,
          referenceId: case_id,
        });
        paymentLinkUrl = link.short_url;
        paymentLinkId = link.id;

        await writeAuditLog({
          case_id: case_id,
          step: "EXECUTE",
          action: "payment_link_created",
          reason: `Razorpay payment link created: ${link.short_url}`,
          policy_rule: policy.policy_rule,
          actor: "razorpay-api",
          metadata: { link_id: link.id, link_url: link.short_url },
        });
      } catch (err) {
        await writeAuditLog({
          case_id: case_id,
          step: "EXECUTE",
          action: "payment_link_failed",
          reason: `Razorpay API error: ${err instanceof Error ? err.message : "Unknown"}. Escalating.`,
          policy_rule: "RAZORPAY_API_FAILURE",
          actor: "revyn-executor",
          metadata: { error: String(err) },
        });

        await supabaseAdmin
          .from("payment_cases")
          .update({
            status: "escalated",
            policy_action: "escalate_to_human",
            policy_reason: "Razorpay payment link creation failed",
          })
          .eq("id", case_id);

        return NextResponse.json(
          { error: "Payment link creation failed, case escalated" },
          { status: 500 }
        );
      }
    } else if (policy.action === "smart_retry") {
      await writeAuditLog({
        case_id: case_id,
        step: "EXECUTE",
        action: "smart_retry_scheduled",
        reason: `Retry scheduled for ${policy.retry_scheduled_for}`,
        policy_rule: policy.policy_rule,
        actor: "revyn-executor",
        metadata: { retry_at: policy.retry_scheduled_for },
      });
    }

    await supabaseAdmin
      .from("payment_cases")
      .update({
        status: "in_progress",
        policy_action: policy.action,
        policy_reason: policy.reason,
        policy_rule: policy.policy_rule,
        retry_count: (paymentCase.retry_count || 0) + 1,
        ...(paymentLinkUrl && { payment_link_url: paymentLinkUrl }),
        ...(paymentLinkId && { payment_link_id: paymentLinkId }),
      })
      .eq("id", case_id);

    return NextResponse.json({
      success: true,
      action: policy.action,
      payment_link_url: paymentLinkUrl,
      retry_scheduled_for: policy.retry_scheduled_for,
    });
  } catch (error) {
    console.error("[Recover API] Error:", error);
    return NextResponse.json(
      { error: "Recovery execution failed", details: String(error) },
      { status: 500 }
    );
  }
}
