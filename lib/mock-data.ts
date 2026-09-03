import type { PaymentCase, BatchMetrics, AuditLog } from "./types";

// ── UTC / INR formatters matching revyn-ui-ux.txt ──
export function formatINR(amountPaise: number): string {
  const rupees = amountPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function formatTimeUTC(isoString: string): string {
  try {
    const d = new Date(isoString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = months[d.getUTCMonth()];
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const mins = String(d.getUTCMinutes()).padStart(2, "0");
    return `${day} ${month}, ${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

// ── 48 Deterministic Recovery Cases ──
const NAMES = [
  "Aarav Sharma", "Priya Patel", "Vikram Malhotra", "Ananya Iyer",
  "Rohan Verma", "Kavita Reddy", "Arjun Nair", "Sneha Kulkarni",
  "Aditya Joshi", "Pooja Mehta", "Siddharth Gupta", "Meera Desai",
  "Karan Singhania", "Ishita Roy", "Nikhil Chopra", "Tanvi Bhatia",
  "Rishi Saxena", "Divya Menon", "Harsh Vardhan", "Ritu Agrawal",
  "Varun Kapoor", "Shreya Sen", "Gaurav Bansal", "Neha Hegde",
  "Abhishek Nambiar", "Swati Pillai", "Manish Pandey", "Shruti Rao",
  "Akash Mittal", "Simran Gill", "Kunal Tiwari", "Aparna Sundaram",
  "Mayank Agarwal", "Bhavna Jain", "Pranav Das", "Anjali Bose",
  "Devendra Chauhan", "Pallavi Ghosh", "Sanjay Bhatt", "Sunita Nair",
  "Naveen Kashyap", "Tarun Goyal", "Urvashi Mishra", "Vivek Sengupta",
  "Yashwant Rana", "Deepika Chawla", "Kartik Trivedi", "Radhika Shenoy"
];

const ROOT_CAUSES = [
  { cause: "insufficient_balance", code: "PAYMENT_FAILED_BALANCE", msg: "Account balance below threshold for debit", action: "send_payment_link", status: "recovered", conf: 0.94 },
  { cause: "bank_timeout", code: "BANK_GATEWAY_TIMEOUT", msg: "Issuer switch timed out after 30s", action: "smart_retry", status: "in_progress", conf: 0.98 },
  { cause: "upi_downtime", code: "UPI_SWITCH_DEGRADED", msg: "National payments switch NPCI latency surge", action: "smart_retry", status: "recovered", conf: 0.92 },
  { cause: "card_expired", code: "CARD_EXPIRED_OR_INACTIVE", msg: "Card expiry date prior to current billing cycle", action: "send_payment_link", status: "recovered", conf: 0.99 },
  { cause: "invalid_cvv", code: "AUTHENTICATION_FAILED", msg: "CVV verification failed 3 times", action: "escalate_to_human", status: "escalated", conf: 0.88 },
  { cause: "mandate_revoked", code: "MANDATE_REVOKED_CUSTOMER", msg: "Customer revoked standing mandate on banking portal", action: "mark_unrecoverable", status: "unrecoverable", conf: 0.96 }
] as const;

export const MOCK_CASES: PaymentCase[] = Array.from({ length: 48 }, (_, i) => {
  const causeMeta = ROOT_CAUSES[i % ROOT_CAUSES.length];
  const name = NAMES[i % NAMES.length];
  const idNum = 1000 + i;
  const now = new Date(Date.now() - (i * 3600000 * 1.5)).toISOString();

  // Deterministic amounts between ₹450 and ₹28,500
  const amountPaise = (Math.floor((((i * 9301 + 49297) % 233280) / 233280) * 28000) + 450) * 100;

  return {
    id: `pay_${idNum}_revyn`,
    merchant_id: "mch_live_rzp_01",
    customer_name: name,
    customer_phone: `+91 98${String(10000000 + (i * 123456) % 89999999).slice(0, 8)}`,
    customer_email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
    amount: amountPaise,
    currency: "INR",
    error_code: causeMeta.code,
    error_message: causeMeta.msg,
    root_cause: causeMeta.cause,
    diagnosis_confidence: causeMeta.conf,
    diagnosis_method: i % 3 === 0 ? "llm_groq" : "rule_based",
    diagnosis_explanation: `Classified via ${i % 3 === 0 ? "Groq Llama 3.3 70B" : "deterministic code tree"} based on gateway response.`,
    policy_action: causeMeta.action,
    policy_reason: `Rule triggered by ${causeMeta.cause}. Safe bounded resolution chosen.`,
    policy_rule: causeMeta.cause === "mandate_revoked" ? "MANDATE_HARD_STOP" : causeMeta.cause === "insufficient_balance" ? "SALARY_WINDOW_RETRY" : "MAX_RETRY_LIMIT",
    status: causeMeta.status,
    retry_count: (i % 3) + 1,
    payment_link_url: causeMeta.action === "send_payment_link" ? `https://rzp.io/i/rec_${idNum}` : undefined,
    payment_link_id: causeMeta.action === "send_payment_link" ? `plink_${idNum}` : undefined,
    recovered_amount: causeMeta.status === "recovered" ? amountPaise : undefined,
    recovered_at: causeMeta.status === "recovered" ? now : undefined,
    created_at: now,
    updated_at: now,
  };
});

// ── 48 Deterministic Metrics ──
const totalAtRisk = MOCK_CASES.reduce((sum, c) => sum + c.amount, 0);
const recoveredCases = MOCK_CASES.filter((c) => c.status === "recovered");
const recoveredPaise = recoveredCases.reduce((sum, c) => sum + c.amount, 0);
const pendingCases = MOCK_CASES.filter((c) => c.status === "in_progress" || c.status === "pending");
const escalatedCases = MOCK_CASES.filter((c) => c.status === "escalated");
const unrecCases = MOCK_CASES.filter((c) => c.status === "unrecoverable" || c.status === "halted");

export const MOCK_METRICS: BatchMetrics = {
  total_cases: MOCK_CASES.length,
  total_at_risk_paise: totalAtRisk,
  recovered_paise: recoveredPaise,
  recovery_rate: recoveredCases.length / MOCK_CASES.length, // ~0.50
  pending_count: pendingCases.length,
  escalated_count: escalatedCases.length,
  unrecoverable_count: unrecCases.length,
  halted_count: 0,
  baseline_recovery_rate: 0.22,
  lift_over_baseline: (recoveredCases.length / MOCK_CASES.length) - 0.22,
};

// ── Deterministic Audit Entries with cryptographic hash fragments ──
export const MOCK_AUDIT_LOGS: AuditLog[] = MOCK_CASES.slice(0, 30).map((c, i) => {
  const steps = ["DETECT", "DIAGNOSE", "DECIDE", "EXECUTE", "RECOVERED"];
  const step = c.status === "recovered" ? "RECOVERED" : c.status === "escalated" ? "DECIDE" : steps[i % steps.length];

  return {
    id: `aud_${2000 + i}`,
    case_id: c.id,
    step: step,
    action: step === "RECOVERED" ? "Payment link settled via webhook" : step === "EXECUTE" ? "Razorpay test link dispatched" : step === "DECIDE" ? `Policy evaluated: ${c.policy_action}` : `Classified root cause: ${c.root_cause}`,
    reason: c.policy_reason || "Deterministic rule evaluation passed",
    policy_rule: c.policy_rule,
    actor: i % 2 === 0 ? "system.policy_engine" : "groq.llama_70b",
    created_at: c.created_at,
    metadata: {
      case_id: c.id,
      amount: c.amount,
      confidence: c.diagnosis_confidence,
      hash_fragment: `sha256:${(3849182 + i * 49201).toString(16)}...${i}b`,
    },
  };
});
