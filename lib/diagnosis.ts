// ============================================================
// Revyn – Diagnosis Engine
// Rule-based first, Groq LLM only for ambiguous cases
// ============================================================

import { diagnosewithGroq } from "./groq";
import type { DiagnosisResult, RootCause } from "./types";

// ── Rule-based error code mapping ────────────────────────────────
// Maps known Razorpay/bank error codes to root causes
const ERROR_CODE_MAP: Record<string, { cause: RootCause; confidence: number }> =
  {
    // Insufficient balance
    BAD_REQUEST_ERROR_INSUFFICIENT_BALANCE: {
      cause: "insufficient_balance",
      confidence: 0.98,
    },
    PAYMENT_DECLINED_INSUFFICIENT_FUNDS: {
      cause: "insufficient_balance",
      confidence: 0.98,
    },
    FUND_INSUFFICIENT: { cause: "insufficient_balance", confidence: 0.95 },
    PAYER_ACCOUNT_CREDITING_NOT_ALLOWED: {
      cause: "insufficient_balance",
      confidence: 0.9,
    },

    // Bank timeout
    GATEWAY_ERROR_TIMEOUT: { cause: "bank_timeout", confidence: 0.95 },
    BAD_REQUEST_ERROR_BANK_TIMEOUT: { cause: "bank_timeout", confidence: 0.97 },
    BANK_NOT_RESPONDING: { cause: "bank_timeout", confidence: 0.93 },

    // Mandate
    BAD_REQUEST_EMANDATE_REVOKED: { cause: "mandate_revoked", confidence: 0.99 },
    BAD_REQUEST_EMANDATE_CANCELLED: {
      cause: "mandate_revoked",
      confidence: 0.99,
    },
    MANDATE_EXPIRED: { cause: "mandate_expired", confidence: 0.99 },
    BAD_REQUEST_MANDATE_EXPIRED: { cause: "mandate_expired", confidence: 0.99 },
    SUBSCRIPTION_AUTH_NOT_ACTIVE: { cause: "mandate_revoked", confidence: 0.95 },

    // Network errors
    GATEWAY_ERROR_NETWORK_ERROR: { cause: "network_error", confidence: 0.9 },
    PAYMENT_GATEWAY_TIMEOUT: { cause: "network_error", confidence: 0.85 },
    CONNECTION_TIMEOUT: { cause: "network_error", confidence: 0.87 },

    // Customer abandoned
    BAD_REQUEST_PAYMENT_CANCELLED_BY_USER: {
      cause: "customer_abandoned",
      confidence: 0.99,
    },
    PAYMENT_TIMEOUT_CUSTOMER_NOT_AUTHORIZED: {
      cause: "customer_abandoned",
      confidence: 0.95,
    },

    // Card issues
    BAD_REQUEST_CARD_EXPIRED: { cause: "card_expired", confidence: 0.99 },
    CARD_EXPIRED: { cause: "card_expired", confidence: 0.99 },
    BAD_REQUEST_INVALID_CVV: { cause: "invalid_cvv", confidence: 0.99 },
    INVALID_CVV: { cause: "invalid_cvv", confidence: 0.99 },

    // UPI
    UPI_SYSTEM_DOWN: { cause: "upi_downtime", confidence: 0.92 },
    NPCI_DOWN: { cause: "upi_downtime", confidence: 0.9 },
    UPI_SERVICE_UNAVAILABLE: { cause: "upi_downtime", confidence: 0.9 },

    // Subscriptions
    SUBSCRIPTION_CHARGE_FAILED: { cause: "subscription_failed", confidence: 0.9 },
  };

// ── Rule-based keyword scan for unknown error messages ────────────
const MESSAGE_PATTERNS: Array<{
  pattern: RegExp;
  cause: RootCause;
  confidence: number;
}> = [
  {
    pattern: /insufficient.*(fund|balance|amount)/i,
    cause: "insufficient_balance",
    confidence: 0.88,
  },
  {
    pattern: /balance.*(low|insufficient|not enough)/i,
    cause: "insufficient_balance",
    confidence: 0.85,
  },
  {
    pattern: /(timeout|timed.?out|not responding)/i,
    cause: "bank_timeout",
    confidence: 0.8,
  },
  {
    pattern: /(mandate|autopay).*(revoke|cancel|deactivate)/i,
    cause: "mandate_revoked",
    confidence: 0.9,
  },
  {
    pattern: /(mandate|autopay).*(expire|expired)/i,
    cause: "mandate_expired",
    confidence: 0.9,
  },
  {
    pattern: /cancelled.*by.*(user|customer)/i,
    cause: "customer_abandoned",
    confidence: 0.9,
  },
  { pattern: /card.*expired/i, cause: "card_expired", confidence: 0.95 },
  { pattern: /invalid.*cvv/i, cause: "invalid_cvv", confidence: 0.93 },
  {
    pattern: /(network|connection).*(error|fail|lost)/i,
    cause: "network_error",
    confidence: 0.8,
  },
  {
    pattern: /upi.*(down|unavailable|fail)/i,
    cause: "upi_downtime",
    confidence: 0.85,
  },
];

const AMBIGUITY_THRESHOLD = 0.75; // Below this → use Groq

// ── Main Diagnosis Function ───────────────────────────────────────
export async function diagnosePayment(
  errorCode: string,
  errorMessage: string
): Promise<DiagnosisResult> {
  // Step 1: Try exact error code match
  const codeMatch = ERROR_CODE_MAP[errorCode.toUpperCase()];
  if (codeMatch && codeMatch.confidence >= AMBIGUITY_THRESHOLD) {
    return {
      root_cause: codeMatch.cause,
      confidence: codeMatch.confidence,
      explanation: `Rule-based: Error code '${errorCode}' maps directly to '${codeMatch.cause}'.`,
      method: "rule_based",
    };
  }

  // Step 2: Try keyword pattern matching on error message
  for (const { pattern, cause, confidence } of MESSAGE_PATTERNS) {
    if (pattern.test(errorMessage)) {
      if (confidence >= AMBIGUITY_THRESHOLD) {
        return {
          root_cause: cause,
          confidence,
          explanation: `Rule-based: Error message matched pattern for '${cause}'.`,
          method: "rule_based",
        };
      }
    }
  }

  // Step 3: Ambiguous case → use Groq LLM
  console.log(
    `[Diagnosis] Ambiguous error '${errorCode}' – delegating to Groq LLM`
  );
  return await diagnosewithGroq(errorCode, errorMessage);
}
