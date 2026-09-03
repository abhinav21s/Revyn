import React from "react";
import type { CaseStatus, RootCause, PolicyAction } from "@/lib/types";

export function StatusBadge({ status }: { status: CaseStatus | string }) {
  const s = status.toLowerCase();

  let color = "var(--muted-foreground)";
  let bg = "rgba(122, 149, 184, 0.12)";
  let border = "rgba(122, 149, 184, 0.25)";
  let label = status;

  if (s === "recovered" || s === "resolved") {
    color = "var(--success)";
    bg = "var(--success-bg)";
    border = "rgba(16, 185, 129, 0.28)";
    label = "Recovered";
  } else if (s === "in_progress" || s === "in progress") {
    color = "var(--primary)";
    bg = "rgba(0, 166, 255, 0.12)";
    border = "rgba(0, 166, 255, 0.3)";
    label = "In Progress";
  } else if (s === "pending") {
    color = "var(--warning)";
    bg = "var(--warning-bg)";
    border = "rgba(245, 158, 11, 0.3)";
    label = "Pending";
  } else if (s === "escalated") {
    color = "var(--warning)";
    bg = "var(--warning-bg)";
    border = "rgba(245, 158, 11, 0.3)";
    label = "Escalated";
  } else if (s === "unrecoverable" || s === "stopped" || s === "halted") {
    color = "var(--destructive)";
    bg = "var(--destructive-bg)";
    border = "rgba(239, 68, 68, 0.3)";
    label = s === "halted" ? "Halted" : "Stopped";
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shrink-0"
      style={{ background: bg, color: color, borderColor: border }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span>{label}</span>
    </span>
  );
}

export function RootCauseBadge({
  cause,
  method,
}: {
  cause?: RootCause;
  method?: string;
}) {
  if (!cause) {
    return (
      <span className="text-[12px] font-mono" style={{ color: "var(--subtle)" }}>
        unclassified
      </span>
    );
  }

  const isLLM = method === "llm_groq";

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className="px-2.5 py-0.5 rounded-[6px] text-[11px] font-mono border"
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        }}
      >
        {cause}
      </span>
      {isLLM && (
        <span
          title="Diagnosed via Groq Llama 3.3 70B"
          className="px-1.5 py-[1px] rounded-[4px] text-[10px] font-medium border"
          style={{
            background: "rgba(0, 166, 255, 0.12)",
            color: "var(--primary)",
            borderColor: "rgba(0, 166, 255, 0.3)",
          }}
        >
          Groq AI
        </span>
      )}
    </div>
  );
}

export function ActionTag({ action }: { action?: PolicyAction | string }) {
  if (!action) return null;

  let label = String(action);
  if (action === "smart_retry") label = "Smart Retry";
  else if (action === "send_payment_link") label = "Razorpay Link";
  else if (action === "escalate_to_human") label = "Escalate";
  else if (action === "mark_unrecoverable") label = "Hard Stop";
  else if (action === "halt_kill_switch") label = "Kill Switch";

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border font-mono shrink-0"
      style={{
        background: "rgba(0, 166, 255, 0.08)",
        color: "var(--primary)",
        borderColor: "rgba(0, 166, 255, 0.35)",
      }}
    >
      {label}
    </span>
  );
}
