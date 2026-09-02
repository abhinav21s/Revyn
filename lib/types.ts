// ============================================================
// Revyn – Shared Types
// ============================================================

export type RootCause =
  | "insufficient_balance"
  | "bank_timeout"
  | "mandate_expired"
  | "mandate_revoked"
  | "network_error"
  | "customer_abandoned"
  | "card_expired"
  | "invalid_cvv"
  | "upi_downtime"
  | "subscription_failed"
  | "unknown";

export type PolicyAction =
  | "smart_retry"
  | "send_payment_link"
  | "send_recovery_message"
  | "escalate_to_human"
  | "mark_unrecoverable"
  | "halt_kill_switch";

export type CaseStatus =
  | "pending"
  | "in_progress"
  | "recovered"
  | "failed"
  | "escalated"
  | "unrecoverable"
  | "halted";

export type DiagnosisMethod = "rule_based" | "llm_groq";

export interface DiagnosisResult {
  root_cause: RootCause;
  confidence: number; // 0.0 – 1.0
  explanation: string;
  method: DiagnosisMethod;
}

export interface PolicyDecision {
  action: PolicyAction;
  reason: string;
  policy_rule: string;
  allowed: boolean;
  retry_scheduled_for?: string; // ISO date string
}

export interface PaymentCase {
  id: string;
  merchant_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  amount: number; // in paise
  currency: string;
  error_code: string;
  error_message: string;
  root_cause?: RootCause;
  diagnosis_confidence?: number;
  diagnosis_method?: DiagnosisMethod;
  diagnosis_explanation?: string;
  policy_action?: PolicyAction;
  policy_reason?: string;
  policy_rule?: string;
  status: CaseStatus;
  retry_count: number;
  payment_link_url?: string;
  payment_link_id?: string;
  recovered_amount?: number;
  recovered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  case_id: string;
  step: string;
  action: string;
  reason: string;
  policy_rule?: string;
  actor: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AppSettings {
  key: string;
  value: string;
  updated_at: string;
}

export interface BatchMetrics {
  total_cases: number;
  total_at_risk_paise: number;
  recovered_paise: number;
  recovery_rate: number;
  pending_count: number;
  escalated_count: number;
  unrecoverable_count: number;
  halted_count: number;
  baseline_recovery_rate: number;
  lift_over_baseline: number;
}

export interface RecoveryMessage {
  channel: "whatsapp" | "sms";
  language: "hinglish" | "english";
  text: string;
}
