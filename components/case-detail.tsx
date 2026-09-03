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
  RefreshCw,
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
      <div className="w-full max-w-xl bg-[#0B0F19] border-l border-[#2E3A52] h-full overflow-y-auto flex flex-col shadow-2xl slide-in-right">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgba(38,48,69,0.4)] flex items-center justify-between sticky top-0 bg-[#0B0F19]/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[14px] font-semibold text-[#F4F6FA] font-mono">
                #{paymentCase.id.slice(0, 8).toUpperCase()}
              </span>
              <StatusBadge status={simulated ? "recovered" : paymentCase.status} />
            </div>
            <p className="text-[12px] text-[#5B6B85] mt-1">
              {paymentCase.merchant_id} · {formatDate(paymentCase.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] bg-[#1A2233] hover:bg-[#202B40] text-[#94A3B8] hover:text-[#F4F6FA] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-4">
          {/* Amount Summary */}
          <div className="p-5 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] flex items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-[11px] text-[#5B6B85] uppercase tracking-[0.04em] font-semibold block mb-1">
                Amount at Risk
              </span>
              <div className="text-[24px] font-bold text-[#F4F6FA] tabular-nums tracking-tight">
                {formatCurrency(paymentCase.amount)}
              </div>
              <div className="text-[12px] text-[#94A3B8] mt-1">
                {paymentCase.customer_name}
                {paymentCase.customer_phone && (
                  <span className="text-[#5B6B85] ml-1.5">· {paymentCase.customer_phone}</span>
                )}
              </div>
            </div>

            {!alreadyRecovered ? (
              <button
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#22C55E] hover:bg-[#22C55E]/90 disabled:opacity-50 text-white text-[13px] font-semibold transition-all shadow-md shadow-[#22C55E]/20 shrink-0"
              >
                {simulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{simulating ? "Simulating…" : "Simulate Paid"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#22C55E] text-[12px] font-semibold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Recovered
              </div>
            )}
          </div>

          {/* Step 1: Diagnosis */}
          <div className="p-5 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-[4px] bg-[rgba(79,124,255,0.15)] text-[#4F7CFF] text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-[14px] font-semibold text-[#F4F6FA]">Root Cause Diagnosis</h3>
              </div>
              <RootCauseBadge cause={paymentCase.root_cause} method={paymentCase.diagnosis_method} />
            </div>

            <div className="rounded-[8px] bg-[#0B0F19] border border-[#2E3A52] p-3.5 space-y-2 text-[12px]">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[#5B6B85] shrink-0">Error Code:</span>
                <span className="font-mono text-[#F4F6FA] text-right">{paymentCase.error_code}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[#5B6B85] shrink-0">Message:</span>
                <span className="text-[#94A3B8] italic text-right">"{paymentCase.error_message}"</span>
              </div>
              {paymentCase.diagnosis_confidence !== undefined && (
                <div className="flex items-center justify-between pt-1.5 border-t border-[#2E3A52]">
                  <span className="text-[#5B6B85]">AI Confidence:</span>
                  <span className="text-[#22C55E] font-bold font-mono">
                    {((paymentCase.diagnosis_confidence || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Policy Decision */}
          <div className="p-5 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-[4px] bg-[rgba(79,124,255,0.15)] text-[#4F7CFF] text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-[14px] font-semibold text-[#F4F6FA]">Policy Engine Decision</h3>
              </div>
              <ActionBadge action={paymentCase.policy_action} />
            </div>

            <div className="rounded-[8px] bg-[#0B0F19] border border-[#2E3A52] p-3.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#5B6B85]">Rule Triggered:</span>
                <span className="font-mono text-[#4F7CFF] font-semibold bg-[rgba(79,124,255,0.1)] border border-[rgba(79,124,255,0.25)] px-2 py-0.5 rounded-[4px]">
                  {paymentCase.policy_rule || "DEFAULT_SAFEGUARD"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5B6B85]">Retry Count:</span>
                <span className="text-[#F4F6FA] font-mono">{paymentCase.retry_count} / 3</span>
              </div>
              <div className="pt-1.5 border-t border-[#2E3A52] text-[#94A3B8] leading-normal">
                <span className="text-[#5B6B85]">Reason: </span>
                {paymentCase.policy_reason || "Evaluated by deterministic engine"}
              </div>
            </div>
          </div>

          {/* Step 3: Razorpay Link */}
          {paymentCase.payment_link_url && (
            <div className="p-5 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-[4px] bg-[rgba(34,197,94,0.15)] text-[#22C55E] text-[11px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-[14px] font-semibold text-[#F4F6FA]">Razorpay Recovery Link</h3>
                </div>
                <span className="text-[10px] font-semibold text-[#F59E0B] px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] font-mono">
                  TEST MODE
                </span>
              </div>

              {/* Link Row */}
              <div className="flex items-center gap-2 p-2.5 rounded-[8px] bg-[#0B0F19] border border-[#2E3A52]">
                <span className="text-[12px] font-mono text-[#4F7CFF] truncate flex-1">
                  {paymentCase.payment_link_url}
                </span>
                <button
                  onClick={() => copyPaymentLink(paymentCase.payment_link_url!)}
                  title="Copy link"
                  className="p-1.5 rounded-[6px] bg-[#1A2233] hover:bg-[#202B40] text-[#94A3B8] hover:text-[#F4F6FA] transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={paymentCase.payment_link_url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open link"
                  className="p-1.5 rounded-[6px] bg-[#1A2233] hover:bg-[#202B40] text-[#94A3B8] hover:text-[#F4F6FA] transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Hinglish Message */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#94A3B8]">
                  <MessageSquare className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Personalized Hinglish Message</span>
                </div>
                <div className="p-3.5 rounded-[8px] bg-[#0B0F19] border border-[#2E3A52] text-[12px] text-[#F4F6FA] leading-relaxed">
                  {getHinglishMessage()}
                </div>
              </div>
            </div>
          )}

          {/* Case Audit Timeline */}
          <div className="space-y-2 pt-1">
            <h3 className="text-[14px] font-semibold text-[#F4F6FA] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4F7CFF]" />
              <span>Case Audit Records</span>
              {loadingLogs && <RefreshCw className="w-3.5 h-3.5 text-[#5B6B85] animate-spin ml-1" />}
            </h3>

            {!loadingLogs && logs.length === 0 ? (
              <p className="text-[12px] text-[#5B6B85] italic">No audit records for this case yet.</p>
            ) : (
              <div className="space-y-2.5 ml-2 border-l border-[#2E3A52] pl-3.5">
                {logs.map((log) => (
                  <div key={log.id} className="relative text-[12px] space-y-0.5">
                    <div className="absolute -left-[18px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#4F7CFF]" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#F4F6FA]">[{log.step}] {log.action}</span>
                      <span className="text-[10px] text-[#5B6B85]">{formatDate(log.created_at)}</span>
                    </div>
                    <p className="text-[#94A3B8] leading-normal">{log.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(38,48,69,0.4)] flex items-center justify-between bg-[#0B0F19]">
          <span className="text-[11px] text-[#5B6B85]">Revyn · Immutable Audit Ledger</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#1A2233] hover:bg-[#202B40] text-[12px] font-medium text-[#94A3B8] hover:text-[#F4F6FA] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
