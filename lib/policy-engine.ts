// ============================================================
// Revyn – Deterministic Policy Engine
// LLM never touches this file. All decisions are rule-based.
// ============================================================

import type {
  RootCause,
  PolicyAction,
  PolicyDecision,
  PaymentCase,
} from "./types";

// ── Policy Constants ──────────────────────────────────────────────
export const POLICY = {
  MAX_RETRY_ATTEMPTS: 3,
  ECONOMIC_FLOOR_PAISE: 10_00, // ₹10 minimum – don't recover less
  SALARY_DAY_START: 1, // Day 1 of month
  SALARY_DAY_END: 5, // Day 5 of month
} as const;

// ── Root causes that must NEVER be retried ────────────────────────
const HARD_STOP_CAUSES: RootCause[] = ["mandate_revoked", "mandate_expired"];

// ── Root causes that warrant a smart retry ───────────────────────
const RETRYABLE_CAUSES: RootCause[] = [
  "insufficient_balance",
  "bank_timeout",
  "network_error",
  "upi_downtime",
  "subscription_failed",
];

// ── Root causes where a payment link is the best action ──────────
const PAYMENT_LINK_CAUSES: RootCause[] = [
  "customer_abandoned",
  "card_expired",
  "invalid_cvv",
];

// ── Helper: Is today a salary day? ───────────────────────────────
function isSalaryDay(): boolean {
  const day = new Date().getDate();
  return day >= POLICY.SALARY_DAY_START && day <= POLICY.SALARY_DAY_END;
}

// ── Helper: Get optimal retry delay in hours ─────────────────────
function getRetryDelayHours(cause: RootCause): number {
  switch (cause) {
    case "bank_timeout":
    case "network_error":
    case "upi_downtime":
      return 1; // Retry in 1 hour (transient issues)
    case "insufficient_balance":
      return isSalaryDay() ? 2 : 24; // Faster retry on salary days
    case "subscription_failed":
      return 12;
    default:
      return 24;
  }
}

// ── Main Policy Engine ────────────────────────────────────────────
export function runPolicyEngine(
  paymentCase: Pick<
    PaymentCase,
    "amount" | "retry_count" | "root_cause" | "status"
  >,
  killSwitchActive: boolean
): PolicyDecision {
  const { amount, retry_count, root_cause } = paymentCase;

  // ── Rule 0: Kill switch – global halt ────────────────────────
  if (killSwitchActive) {
    return {
      action: "halt_kill_switch",
      reason: "Global kill switch is active. All recovery actions halted.",
      policy_rule: "KILL_SWITCH",
      allowed: false,
    };
  }

  // ── Rule 1: Economic floor ────────────────────────────────────
  if (amount < POLICY.ECONOMIC_FLOOR_PAISE) {
    return {
      action: "mark_unrecoverable",
      reason: `Amount ₹${(amount / 100).toFixed(2)} is below the economic floor of ₹${POLICY.ECONOMIC_FLOOR_PAISE / 100}. Recovery not cost-effective.`,
      policy_rule: "ECONOMIC_FLOOR",
      allowed: false,
    };
  }

  // ── Rule 2: Hard stop for revoked/expired mandates ────────────
  if (root_cause && HARD_STOP_CAUSES.includes(root_cause)) {
    return {
      action: "mark_unrecoverable",
      reason: `Root cause '${root_cause}' requires manual intervention. Retrying would violate RBI mandate rules.`,
      policy_rule: "HARD_STOP_MANDATE",
      allowed: false,
    };
  }

  // ── Rule 3: Max retry limit ───────────────────────────────────
  if (retry_count >= POLICY.MAX_RETRY_ATTEMPTS) {
    return {
      action: "escalate_to_human",
      reason: `Maximum retry limit of ${POLICY.MAX_RETRY_ATTEMPTS} reached. Escalating to human review queue.`,
      policy_rule: "MAX_RETRY_LIMIT",
      allowed: false,
    };
  }

  // ── Rule 4: Smart retry for transient/balance issues ─────────
  if (root_cause && RETRYABLE_CAUSES.includes(root_cause)) {
    const delayHours = getRetryDelayHours(root_cause);
    const retryAt = new Date();
    retryAt.setHours(retryAt.getHours() + delayHours);

    const salaryNote =
      root_cause === "insufficient_balance" && isSalaryDay()
        ? " (salary day detected – faster retry window)"
        : "";

    return {
      action: "smart_retry",
      reason: `Root cause '${root_cause}' is transient. Scheduling smart retry in ${delayHours}h${salaryNote}.`,
      policy_rule: "SMART_RETRY",
      allowed: true,
      retry_scheduled_for: retryAt.toISOString(),
    };
  }

  // ── Rule 5: Send payment link for card/UPI issues ─────────────
  if (root_cause && PAYMENT_LINK_CAUSES.includes(root_cause)) {
    return {
      action: "send_payment_link",
      reason: `Root cause '${root_cause}' requires customer action. Generating a new Razorpay payment link.`,
      policy_rule: "PAYMENT_LINK",
      allowed: true,
    };
  }

  // ── Rule 6: Unknown – escalate to human ──────────────────────
  return {
    action: "escalate_to_human",
    reason: `Unknown or ambiguous root cause '${root_cause}'. Escalating to human review.`,
    policy_rule: "UNKNOWN_ESCALATE",
    allowed: false,
  };
}
