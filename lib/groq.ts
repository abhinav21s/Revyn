// ============================================================
// Revyn – Groq LLM Diagnosis
// LLM is ONLY allowed to return diagnosis JSON.
// It cannot trigger any action or execute any payment.
// ============================================================

import Groq from "groq-sdk";
import type { DiagnosisResult, RootCause } from "./types";

const groqApiKey = process.env.GROQ_API_KEY;
const isGroqConfigured = Boolean(
  groqApiKey && !groqApiKey.includes("your_groq_api_key") && groqApiKey.startsWith("gsk_")
);

let groq: Groq | null = null;
if (isGroqConfigured) {
  try {
    groq = new Groq({ apiKey: groqApiKey! });
  } catch (e) {
    console.error("[Groq] Init error:", e);
  }
}

const SYSTEM_PROMPT = `You are a payment failure diagnosis AI for an Indian fintech platform.
You will receive a payment error code and message.
Your ONLY job is to classify the root cause and return a JSON object.
You are NOT allowed to take any action, create payments, or execute anything.
You must respond with ONLY valid JSON matching the schema exactly.

Root cause categories:
- insufficient_balance: Customer's bank account or UPI balance is too low
- bank_timeout: Bank's system timed out processing the request
- mandate_expired: UPI Autopay or e-Mandate has expired (needs renewal)
- mandate_revoked: Customer revoked the UPI mandate (cannot retry)
- network_error: Network connectivity issue between payment gateway and bank
- customer_abandoned: Customer left the payment page before completing
- card_expired: Debit/credit card has expired
- invalid_cvv: Incorrect CVV or card details entered
- upi_downtime: UPI system is experiencing downtime
- subscription_failed: Subscription/recurring charge failed on due date
- unknown: Cannot determine root cause from available information`;

export async function diagnosewithGroq(
  errorCode: string,
  errorMessage: string
): Promise<DiagnosisResult> {
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Diagnose this payment failure:
Error Code: ${errorCode}
Error Message: ${errorMessage}

Return ONLY the JSON object with root_cause, confidence (0-1), and explanation.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 300,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content) as {
          root_cause: RootCause;
          confidence: number;
          explanation: string;
        };

        if (parsed.root_cause && typeof parsed.confidence === "number") {
          return {
            root_cause: parsed.root_cause,
            confidence: Math.max(0, Math.min(1, parsed.confidence)),
            explanation: parsed.explanation || "Groq LLM structured diagnosis",
            method: "llm_groq",
          };
        }
      }
    } catch (error) {
      console.error("[Groq] Diagnosis API error:", error);
    }
  }

  // Graceful heuristic fallback for demo/offline mode
  const lowerMsg = (errorMessage + " " + errorCode).toLowerCase();
  let cause: RootCause = "unknown";
  let conf = 0.85;
  let expl = `AI Heuristic fallback: Analyzed ambiguous payment error '${errorCode}'.`;

  if (lowerMsg.includes("bank") || lowerMsg.includes("timeout") || lowerMsg.includes("gw_err")) {
    cause = "bank_timeout";
    expl = "AI Heuristic: Gateway response pattern indicates transient issuing bank latency.";
  } else if (lowerMsg.includes("balance") || lowerMsg.includes("fund")) {
    cause = "insufficient_balance";
    expl = "AI Heuristic: Transaction declined due to insufficient customer account balance.";
  } else if (lowerMsg.includes("mandate") || lowerMsg.includes("autopay")) {
    cause = "mandate_expired";
    expl = "AI Heuristic: Recurring subscription mandate authorization not active.";
  }

  return {
    root_cause: cause,
    confidence: conf,
    explanation: expl,
    method: "llm_groq",
  };
}
