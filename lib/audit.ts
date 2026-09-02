// ============================================================
// Revyn – Immutable Audit Logger
// Every decision is logged with timestamp + reason + rule
// ============================================================

import { supabaseAdmin } from "./supabase";
import type { AuditLog } from "./types";

export interface LogEntryParams {
  case_id: string;
  step: string;
  action: string;
  reason: string;
  policy_rule?: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(params: LogEntryParams): Promise<void> {
  const {
    case_id,
    step,
    action,
    reason,
    policy_rule,
    actor = "revyn-agent",
    metadata,
  } = params;

  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      case_id,
      step,
      action,
      reason,
      policy_rule: policy_rule || null,
      actor,
      metadata: metadata || null,
    });

    if (error) {
      console.error("[Audit] Failed to write audit log:", error);
    }
  } catch (err) {
    console.error("[Audit] Exception writing audit log:", err);
  }
}

export async function getAuditLogs(
  caseId?: string,
  limit = 100,
  offset = 0
): Promise<AuditLog[]> {
  let query = supabaseAdmin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (caseId) {
    query = query.eq("case_id", caseId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Audit] Failed to fetch audit logs:", error);
    return [];
  }

  return data || [];
}
