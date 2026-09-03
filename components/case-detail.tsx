"use client";

import React, { useState, useEffect } from "react";
import type { PaymentCase, AuditLog } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, RootCauseBadge, ActionTag } from "./status-badge";
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Activity,
  Cpu,
} from "lucide-react";

interface CaseDetailProps {
  paymentCase: PaymentCase | null;
  onClose: () => void;
  onCaseUpdated?: () => void;
  inline?: boolean;
}

export function CaseDetail({ paymentCase, onClose, onCaseUpdated, inline = false }: CaseDetailProps) {
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

  if (!paymentCase) return null;

  const isRecovered = paymentCase.status === "recovered" || simulated;
  const confidence = Math.round((paymentCase.diagnosis_confidence || 0.94) * 100);

  const content = (
    <div className={`w-full flex flex-col ${inline ? "h-auto max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border border-[#1C273E] bg-[#0F1523] shadow-2xl" : "w-full max-w-xl h-full bg-[#090D17] border-l border-[#1C273E] overflow-y-auto shadow-2xl animate-drawer"}`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#1C273E] flex items-center justify-between sticky top-0 bg-[#0F1523]/95 backdrop-blur z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-bold font-mono text-[#0084FF]">
              #{paymentCase.id.slice(0, 8).toUpperCase()}
            </span>
            <StatusBadge status={isRecovered ? "recovered" : paymentCase.status} />
          </div>
          <p className="text-[12px] font-mono text-[#64748B] mt-1">
            {paymentCase.merchant_id} · {formatDate(paymentCase.created_at)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-colors"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Amount Card */}
        <div className="p-5 rounded-2xl border border-[#1C273E] bg-[#090D17] flex items-center justify-between gap-4 shadow-md">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
              Amount at Risk
            </span>
            <div className="text-[28px] font-black font-mono tracking-tight text-[#F8FAFC] leading-none">
              {formatCurrency(paymentCase.amount)}
            </div>
            <div className="text-[13px] font-medium text-[#94A3B8] mt-2">
              {paymentCase.customer_name}
              {paymentCase.customer_phone && (
                <span className="ml-2 font-mono text-[11px] text-[#64748B]">
                  · {paymentCase.customer_phone}
                </span>
              )}
            </div>
          </div>

          {!isRecovered ? (
            <button
              onClick={handleSimulatePayment}
              disabled={simulating}
              className="px-4 py-2.5 rounded-xl text-[12px] font-bold bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
            >
              {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{simulating ? "Simulating…" : "Simulate Paid"}</span>
            </button>
          ) : (
            <div className="px-3.5 py-1.5 rounded-full text-[12px] font-bold bg-emerald-500/12 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Recovered</span>
            </div>
          )}
        </div>

        {/* Diagnosis & Confidence Meter */}
        <div className="p-5 rounded-2xl border border-[#1C273E] bg-[#090D17] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#0084FF]" />
              <h4 className="text-[14px] font-bold text-[#F8FAFC]">
                Diagnosis & Confidence Meter
              </h4>
            </div>
            <RootCauseBadge cause={paymentCase.root_cause} method={paymentCase.diagnosis_method} />
          </div>

          {/* Confidence Progress Meter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#64748B] font-medium">AI Diagnostic Confidence</span>
              <span className="text-[#0084FF] font-bold">{confidence}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden bg-[#141C2E] border border-[#1C273E] p-[1px]">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#0084FF] to-[#38BDF8] shadow-[0_0_10px_#0084FF]"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* Error detail */}
          <div className="p-3.5 rounded-xl border border-[#1C273E] bg-[#06080F] text-[12px] space-y-1.5">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-[#64748B]">Gateway Error Code:</span>
              <span className="text-[#F8FAFC] font-semibold">{paymentCase.error_code}</span>
            </div>
            <div className="text-[12px] text-[#94A3B8] leading-relaxed italic">
              "{paymentCase.error_message}"
            </div>
          </div>
        </div>

        {/* Policy Decision Trace */}
        <div className="p-5 rounded-2xl border border-[#1C273E] bg-[#090D17] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0084FF]" />
              <h4 className="text-[14px] font-bold text-[#F8FAFC]">
                Policy Decision Trace
              </h4>
            </div>
            <ActionTag action={paymentCase.policy_action} />
          </div>

          <div className="p-3.5 rounded-xl border border-[#1C273E] bg-[#06080F] text-[12px] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Rule Triggered:</span>
              <span className="font-mono font-bold text-[#0084FF] bg-[#0084FF]/10 px-2 py-0.5 rounded border border-[#0084FF]/30">
                {paymentCase.policy_rule || "DEFAULT_SAFEGUARD"}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#64748B]">Attempt Counter:</span>
              <span className="text-[#F8FAFC] font-bold">{paymentCase.retry_count || 0} of 3</span>
            </div>
            <div className="text-[12px] pt-2 border-t border-[#1C273E] text-[#94A3B8] leading-relaxed">
              <span className="text-[#64748B] font-medium">Policy Engine Reason: </span>
              {paymentCase.policy_reason || "Evaluated through deterministic guardrail rules"}
            </div>
          </div>
        </div>

        {/* Razorpay Recovery Link */}
        {paymentCase.payment_link_url && (
          <div className="p-5 rounded-2xl border border-[#1C273E] bg-[#090D17] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#F8FAFC]">
                Razorpay Recovery Link
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                TEST MODE
              </span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl border border-[#1C273E] bg-[#06080F] font-mono text-[12px]">
              <span className="truncate flex-1 text-[#0084FF]">
                {paymentCase.payment_link_url}
              </span>
              <button
                onClick={() => copyPaymentLink(paymentCase.payment_link_url!)}
                className="p-1.5 rounded-lg bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={paymentCase.payment_link_url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                title="Open test link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Case Audit Timeline */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-[14px] font-bold text-[#F8FAFC] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0084FF]" />
              <span>Case Audit Ledger</span>
            </h4>
            {loadingLogs && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#64748B]" />}
          </div>

          {logs.length === 0 && !loadingLogs ? (
            <p className="text-[12px] italic text-[#64748B]">
              No audit entries recorded for this case yet.
            </p>
          ) : (
            <div className="space-y-3.5 border-l-2 border-[#1C273E] ml-2 pl-4">
              {logs.map((log) => (
                <div key={log.id} className="relative text-[12px] space-y-1">
                  <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0084FF] shadow-[0_0_8px_#0084FF]" />
                  <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                    <span className="font-bold text-[#F8FAFC]">
                      [{log.step}] {log.action}
                    </span>
                    <span className="text-[#64748B]">{formatDate(log.created_at)}</span>
                  </div>
                  <p className="text-[12px] text-[#94A3B8] leading-relaxed">
                    {log.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#1C273E] flex items-center justify-between bg-[#0F1523]">
        <span className="text-[11px] font-mono text-[#64748B]">
          Revyn · Bounded Execution Engine
        </span>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="flex-1" onClick={onClose} />
      {content}
    </div>
  );
}
