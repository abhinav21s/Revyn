"use client";

import React, { useState, useEffect } from "react";
import type { PaymentCase, AuditLog } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, RootCauseBadge, ActionBadge } from "./status-badge";
import {
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

interface CaseDetailProps {
  paymentCase: PaymentCase | null;
  onClose: () => void;
  onCaseUpdated?: () => void;
}

export function CaseDetail({
  paymentCase,
  onClose,
  onCaseUpdated,
}: CaseDetailProps) {
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (paymentCase?.id) {
      fetchCaseLogs(paymentCase.id);
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
        body: JSON.stringify({
          case_id: paymentCase.id,
          simulate_recovery: true,
        }),
      });
      if (res.ok) {
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

  if (!paymentCase) return null;

  // Generate Hinglish customer message preview (Track 3 Brief requirement)
  const getHinglishMessage = () => {
    const name = paymentCase.customer_name.split(" ")[0] || "Customer";
    const amountStr = `₹${(paymentCase.amount / 100).toFixed(0)}`;
    const link = paymentCase.payment_link_url || "https://rzp.io/i/revyn_demo";

    if (paymentCase.root_cause === "insufficient_balance") {
      return `Namaste ${name}! Aapka ${amountStr} ka payment bank balance issue ki wajah se complete nahi ho paya. Please apna balance check karke is link se retry karein: ${link}`;
    }
    if (paymentCase.root_cause === "bank_timeout" || paymentCase.root_cause === "upi_downtime") {
      return `Hi ${name}, aapke bank ke server mein temporary downtime tha jis wajah se ${amountStr} ka payment ruk gaya. Humne aapke liye direct secure link generate kiya hai: ${link}`;
    }
    if (paymentCase.root_cause === "card_expired" || paymentCase.root_cause === "invalid_cvv") {
      return `Hi ${name}, aapke card details update hone ki zaroorat hai. Please kisi doosre UPI ya Card option se yahan pay karein (${amountStr}): ${link}`;
    }
    return `Namaste ${name}! Aapka ${amountStr} ka payment incomplete tha. Aap is direct link se complete kar sakte hain: ${link}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-[#0E1424] border-l border-[#1F2937] h-full overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-[#1F2937] flex items-center justify-between sticky top-0 bg-[#0E1424]/90 backdrop-blur z-10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Case #{paymentCase.id.slice(0, 8)}
                </h2>
                <StatusBadge status={paymentCase.status} />
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ingested {formatDate(paymentCase.created_at)} • {paymentCase.merchant_id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Payment Summary Box */}
            <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 uppercase font-medium">
                  Amount at Risk
                </span>
                <div className="text-2xl font-bold text-white mt-0.5">
                  {formatCurrency(paymentCase.amount)}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Customer: <span className="text-zinc-200 font-medium">{paymentCase.customer_name}</span>{" "}
                  ({paymentCase.customer_phone || paymentCase.customer_email || "N/A"})
                </div>
              </div>
              {paymentCase.status !== "recovered" && (
                <button
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {simulating ? "Simulating..." : "Simulate Customer Paid"}
                </button>
              )}
            </div>

            {/* Step 1 & 2: Diagnosis Card */}
            <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-semibold text-white">
                    Root Cause Diagnosis
                  </h3>
                </div>
                <RootCauseBadge
                  cause={paymentCase.root_cause}
                  method={paymentCase.diagnosis_method}
                />
              </div>

              <div className="p-3 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Raw Error Code:</span>
                  <span className="font-mono text-zinc-200">
                    {paymentCase.error_code}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Error Message:</span>
                  <span className="text-zinc-300 italic text-right max-w-xs">
                    "{paymentCase.error_message}"
                  </span>
                </div>
                {paymentCase.diagnosis_confidence !== undefined && (
                  <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-[#1F2937]">
                    <span>AI Confidence Score:</span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      {((paymentCase.diagnosis_confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {paymentCase.diagnosis_explanation && (
                  <p className="text-[11px] text-zinc-400 pt-1 text-zinc-300">
                    💡 {paymentCase.diagnosis_explanation}
                  </p>
                )}
              </div>
            </div>

            {/* Step 3: Policy Engine Decision */}
            <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-semibold text-white">
                    Deterministic Policy Decision
                  </h3>
                </div>
                <ActionBadge action={paymentCase.policy_action} />
              </div>

              <div className="p-3 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Policy Rule Triggered:</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {paymentCase.policy_rule || "DEFAULT_SAFEGUARD"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Retry Count:</span>
                  <span className="text-zinc-300">
                    {paymentCase.retry_count} / 3 maximum
                  </span>
                </div>
                <div className="text-zinc-300 pt-1 border-t border-[#1F2937]">
                  <span className="text-zinc-400">Policy Reason: </span>
                  {paymentCase.policy_reason || "Evaluated by deterministic engine"}
                </div>
              </div>
            </div>

            {/* Step 4: Execution & Razorpay Link */}
            {paymentCase.payment_link_url && (
              <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      Razorpay Test Mode Link
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-blue-400 truncate">
                      {paymentCase.payment_link_url}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          copyPaymentLink(paymentCase.payment_link_url!)
                        }
                        className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={paymentCase.payment_link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Hinglish WhatsApp Recovery Copy Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Personalized Hinglish WhatsApp Recovery Message</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#072418]/40 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed font-sans">
                    {getHinglishMessage()}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Case Audit History Timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Immutable Audit Trail for this Case
              </h3>

              {loadingLogs ? (
                <div className="text-xs text-zinc-500">Loading audit history...</div>
              ) : logs.length === 0 ? (
                <div className="text-xs text-zinc-500">No logs found.</div>
              ) : (
                <div className="space-y-2 border-l-2 border-[#1F2937] ml-2 pl-4">
                  {logs.map((log) => (
                    <div key={log.id} className="relative text-xs space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200">
                          [{log.step}] {log.action}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        {log.reason}
                      </p>
                      {log.policy_rule && (
                        <span className="inline-block text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded">
                          Rule: {log.policy_rule}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1F2937] bg-[#0E1424] flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Revyn Bounded Agent • Immutable Audit Ledger
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
