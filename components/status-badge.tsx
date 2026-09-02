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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Recovered
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
          In Progress
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
    case "escalated":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          Escalated
        </span>
      );
    case "unrecoverable":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-700/30 text-zinc-400 border border-zinc-700">
          <XCircle className="w-3.5 h-3.5" />
          Unrecoverable
        </span>
      );
    case "halted":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          Halted (Kill Switch)
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
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
    <div className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
        {label}
      </span>
      {isLLM && (
        <span
          title="Diagnosed via Groq LLM (Ambiguous Case)"
          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
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
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400">
          <RefreshCw className="w-3 h-3" /> Smart Retry
        </span>
      );
    case "send_payment_link":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
          <Send className="w-3 h-3" /> Razorpay Link
        </span>
      );
    case "escalate_to_human":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-400">
          <AlertTriangle className="w-3 h-3" /> Human Escalation
        </span>
      );
    case "mark_unrecoverable":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
          <UserX className="w-3 h-3" /> Hard Stop
        </span>
      );
    case "halt_kill_switch":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400">
          <ShieldAlert className="w-3 h-3" /> Kill Switch
        </span>
      );
    default:
      return <span className="text-xs text-zinc-400">{action}</span>;
  }
}
