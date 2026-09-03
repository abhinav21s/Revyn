import React from "react";
import { cn } from "@/lib/utils";
import type { CaseStatus, RootCause, PolicyAction } from "@/lib/types";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Send,
  UserX,
  Zap,
} from "lucide-react";

export function StatusBadge({ status }: { status: CaseStatus }) {
  switch (status) {
    case "recovered":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/12 text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Recovered
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/12 text-blue-400 border border-blue-500/25">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          In Progress
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/12 text-amber-400 border border-amber-500/25">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
    case "escalated":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/12 text-purple-400 border border-purple-500/25">
          <AlertTriangle className="w-3.5 h-3.5" />
          Escalated
        </span>
      );
    case "unrecoverable":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F2937] text-zinc-400 border border-[#374151]">
          <XCircle className="w-3.5 h-3.5" />
          Unrecoverable
        </span>
      );
    case "halted":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/12 text-rose-400 border border-rose-500/25">
          <ShieldAlert className="w-3.5 h-3.5" />
          Halted
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F2937] text-zinc-300 border border-[#374151]">
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
      <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
        <HelpCircle className="w-3 h-3" />
        Unclassified
      </span>
    );
  }

  const label = cause
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const isLLM = method === "llm_groq";

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1F2937] text-zinc-200 border border-[#374151]/60">
        {label}
      </span>
      {isLLM && (
        <span
          title="Diagnosed via Groq Llama 3.3 70B (Ambiguous case)"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
        >
          <Zap className="w-2.5 h-2.5" />
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
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
          <RefreshCw className="w-3.5 h-3.5" /> Smart Retry
        </span>
      );
    case "send_payment_link":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
          <Send className="w-3.5 h-3.5" /> Razorpay Link
        </span>
      );
    case "escalate_to_human":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400">
          <AlertTriangle className="w-3.5 h-3.5" /> Escalate
        </span>
      );
    case "mark_unrecoverable":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
          <UserX className="w-3.5 h-3.5" /> Hard Stop
        </span>
      );
    case "halt_kill_switch":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
          <ShieldAlert className="w-3.5 h-3.5" /> Kill Switch
        </span>
      );
    default:
      return <span className="text-xs text-zinc-400">{action}</span>;
  }
}
