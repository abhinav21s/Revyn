"use client";

import React, { useState, useEffect } from "react";
import type { PaymentCase, AuditLog } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, RootCauseBadge, ActionBadge } from "./status-badge";
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  Zap,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

interface CaseDetailProps {
  paymentCase: PaymentCase | null;
  onClose: () => void;
  onCaseUpdated?: () => void;
}

export function CaseDetail({ paymentCase, onClose, onCaseUpdated }: CaseDetailProps) {
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulated, setSimulated] = useState(false);

  useEffect(() => {
    if (paymentCase?.id) {
      fetchCaseLogs(paymentCase.id);
      setSimulated(false);
    }
  }, [paymentCase?.id]);

  const fetchCaseLogs = async (caseId: string) => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/audit?case_id=${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!paymentCase) return;
    setSimulating(true);
    try {
      const res = await fetch("/api/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: paymentCase.id, simulate_recovery: true }),
      });
      if (res.ok) {
        setSimulated(true);
        fetchCaseLogs(paymentCase.id);
        if (onCaseUpdated) onCaseUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const copyPaymentLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHinglishMessage = () => {
    if (!paymentCase) return "";
    const name = paymentCase.customer_name.split(" ")[0] || "Customer";
    const amountStr = `₹${(paymentCase.amount / 100).toFixed(0)}`;
    const link = paymentCase.payment_link_url || "https://rzp.io/i/revyn";
    if (paymentCase.root_cause === "insufficient_balance")
      return `Namaste ${name}! Aapka ${amountStr} ka payment bank balance issue ki wajah se complete nahi ho paya. Balance check karke is link se retry karein: ${link}`;
    if (paymentCase.root_cause === "bank_timeout" || paymentCase.root_cause === "upi_downtime")
      return `Hi ${name}, aapke bank mein temporary issue tha jis wajah se ${amountStr} ka payment ruk gaya. Humne aapke liye direct secure link banaya hai: ${link}`;
    if (paymentCase.root_cause === "card_expired" || paymentCase.root_cause === "invalid_cvv")
      return `Hi ${name}, aapke card details update hone ki zaroorat hai. Please kisi aur UPI ya card se yahan pay karein (${amountStr}): ${link}`;
    return `Namaste ${name}! Aapka ${amountStr} ka payment incomplete tha. Aap is direct link se complete kar sakte hain: ${link}`;
  };

  if (!paymentCase) return null;

  const alreadyRecovered = paymentCase.status === "recovered" || simulated;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-xl bg-[#0B0F19] border-l border-[#374151]/60 h-full overflow-y-auto flex flex-col shadow-2xl slide-in-right">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-[#374151]/60 flex items-center justify-between sticky top-0 bg-[#0B0F19]/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-bold text-white font-mono">
                #{paymentCase.id.slice(0, 8).toUpperCase()}
              </span>
              <StatusBadge status={simulated ? "recovered" : paymentCase.status} />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {paymentCase.merchant_id} · {formatDate(paymentCase.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* ── Amount Summary ─────────────────────────────────── */}
          <div className="p-5 rounded-2xl bg-[#111827] border border-[#374151]/60 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-zinc-500 font-medium block mb-1">
                Amount at Risk
              </span>
              <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
                {formatCurrency(paymentCase.amount)}
              </div>
              <div className="text-xs text-zinc-500 mt-1.5">
                {paymentCase.customer_name}
                {paymentCase.customer_phone && (
                  <span className="text-zinc-600 ml-1.5">· {paymentCase.customer_phone}</span>
                )}
              </div>
            </div>

            {!alreadyRecovered ? (
              <button
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-100 shrink-0"
              >
                {simulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{simulating ? "Simulating…" : "Simulate Paid"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/12 border border-emerald-500/25 text-emerald-400 text-xs font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                Recovered
              </div>
            )}
          </div>

          {/* ── Step 1: Diagnosis ─────────────────────────────── */}
          <div className="p-5 rounded-2xl bg-[#111827] border border-[#374151]/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/20">
                  1
                </span>
                <h3 className="text-sm font-bold text-white">Root Cause Diagnosis</h3>
              </div>
              <RootCauseBadge cause={paymentCase.root_cause} method={paymentCase.diagnosis_method} />
            </div>

            <div className="rounded-xl bg-[#0B0F19] border border-[#374151]/60 p-4 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-500 shrink-0">Error Code:</span>
                <span className="font-mono text-zinc-200 text-right">{paymentCase.error_code}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-500 shrink-0">Message:</span>
                <span className="text-zinc-300 italic text-right">"{paymentCase.error_message}"</span>
              </div>
              {paymentCase.diagnosis_confidence !== undefined && (
                <div className="flex items-center justify-between pt-2 border-t border-[#374151]/60">
                  <span className="text-zinc-500">AI Confidence:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {((paymentCase.diagnosis_confidence || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {paymentCase.diagnosis_explanation && (
                <p className="text-[11px] text-zinc-400 pt-1 leading-relaxed">
                  💡 {paymentCase.diagnosis_explanation}
                </p>
              )}
            </div>
          </div>

          {/* ── Step 2: Policy Decision ────────────────────────── */}
          <div className="p-5 rounded-2xl bg-[#111827] border border-[#374151]/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/20">
                  2
                </span>
                <h3 className="text-sm font-bold text-white">Policy Engine Decision</h3>
              </div>
              <ActionBadge action={paymentCase.policy_action} />
            </div>

            <div className="rounded-xl bg-[#0B0F19] border border-[#374151]/60 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Rule Triggered:</span>
                <span className="font-mono text-blue-400 font-bold bg-blue-500/8 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                  {paymentCase.policy_rule || "DEFAULT_SAFEGUARD"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Retry Count:</span>
                <span className="text-zinc-300 font-mono">{paymentCase.retry_count} / 3</span>
              </div>
              <div className="pt-2 border-t border-[#374151]/60 text-zinc-400 leading-relaxed">
                <span className="text-zinc-500">Reason: </span>
                {paymentCase.policy_reason || "Evaluated by deterministic engine"}
              </div>
            </div>
          </div>

          {/* ── Step 3: Razorpay Link ─────────────────────────── */}
          {paymentCase.payment_link_url && (
            <div className="p-5 rounded-2xl bg-[#111827] border border-[#374151]/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-500/20">
                    3
                  </span>
                  <h3 className="text-sm font-bold text-white">Razorpay Recovery Link</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-mono">
                  TEST MODE
                </span>
              </div>

              {/* Link Row */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0B0F19] border border-[#374151]/60">
                <span className="text-xs font-mono text-blue-400 truncate flex-1">
                  {paymentCase.payment_link_url}
                </span>
                <button
                  onClick={() => copyPaymentLink(paymentCase.payment_link_url!)}
                  title="Copy link"
                  className="p-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-zinc-400 hover:text-white transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={paymentCase.payment_link_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open link"
                  className="p-2 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-zinc-400 hover:text-white transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Hinglish Message */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Personalized Hinglish Recovery Message</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-100/90 leading-relaxed">
                  {getHinglishMessage()}
                </div>
              </div>
            </div>
          )}

          {/* ── Case Audit Timeline ───────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Case Audit History</span>
              {loadingLogs && <RefreshCw className="w-3.5 h-3.5 text-zinc-500 animate-spin ml-1" />}
            </h3>

            {!loadingLogs && logs.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No audit entries for this case yet.</p>
            ) : (
              <div className="space-y-3 ml-3 border-l-2 border-[#374151]/60 pl-4">
                {logs.map((log) => (
                  <div key={log.id} className="relative text-xs space-y-1">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#374151] border-2 border-[#0B0F19]" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-zinc-200">[{log.step}] {log.action}</span>
                      <span className="text-[10px] text-zinc-600">{formatDate(log.created_at)}</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">{log.reason}</p>
                    {log.policy_rule && (
                      <span className="inline-block text-[10px] font-mono text-blue-400 bg-blue-500/8 border border-blue-500/20 px-1.5 py-0.5 rounded-lg">
                        {log.policy_rule}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-[#374151]/60 flex items-center justify-between bg-[#0B0F19]">
          <span className="text-[11px] text-zinc-600">Revyn · Immutable Audit Ledger</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-xs font-semibold text-zinc-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
