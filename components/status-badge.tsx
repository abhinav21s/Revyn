import React from "react";
import type { CaseStatus, RootCause, PolicyAction } from "@/lib/types";

export function StatusBadge({ status }: { status: CaseStatus }) {
  switch (status) {
    case "recovered":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[rgba(34,197,94,0.1)] text-[#22C55E] border border-[rgba(34,197,94,0.25)] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          Recovered
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.25)] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
          In Progress
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.25)] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          Pending
        </span>
      );
    case "escalated":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.25)] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          Escalated
        </span>
      );
    case "unrecoverable":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[rgba(100,116,139,0.1)] text-[#64748B] border border-[rgba(100,116,139,0.25)] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
          Unrecoverable
        </span>
      );
    case "halted":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.25)] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          Halted
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[#1A2233] text-[#94A3B8] border border-[#2E3A52] shrink-0">
          {status}
        </span>
      );
  }
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
      <span className="text-[12px] text-[#5B6B85] font-mono">
        unclassified
      </span>
    );
  }

  const isLLM = method === "llm_groq";

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {/* Root Cause pill: padding: 3px 10px, border-radius: 6px, bg: #0B0F19, border: #2E3A52, monospace, font-size: 11px */}
      <span className="px-[10px] py-[3px] rounded-[6px] bg-[#0B0F19] border border-[#2E3A52] text-[11px] font-mono text-[#F4F6FA] shrink-0">
        {cause}
      </span>
      {isLLM && (
        <span
          title="Diagnosed via Groq Llama 3.3 70B"
          className="px-1.5 py-[2px] rounded-[4px] text-[10px] font-medium bg-[rgba(79,124,255,0.15)] text-[#4F7CFF] border border-[rgba(79,124,255,0.3)] shrink-0"
        >
          Groq AI
        </span>
      )}
    </div>
  );
}

export function ActionBadge({ action }: { action?: PolicyAction }) {
  if (!action) return null;

  switch (action) {
    case "smart_retry":
      return (
        <span className="text-[12px] font-medium text-[#4F7CFF]">
          Smart Retry
        </span>
      );
    case "send_payment_link":
      return (
        <span className="text-[12px] font-medium text-[#22C55E]">
          Razorpay Link
        </span>
      );
    case "escalate_to_human":
      return (
        <span className="text-[12px] font-medium text-[#EF4444]">
          Escalate
        </span>
      );
    case "mark_unrecoverable":
      return (
        <span className="text-[12px] font-medium text-[#64748B]">
          Hard Stop
        </span>
      );
    case "halt_kill_switch":
      return (
        <span className="text-[12px] font-medium text-[#EF4444]">
          Kill Switch
        </span>
      );
    default:
      return <span className="text-[12px] text-[#94A3B8]">{action}</span>;
  }
}
