"use client";

import React, { useState, useEffect } from "react";
import type { PaymentCase, AuditLog } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, ActionTag } from "./status-badge";
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
  MessageSquare,
  CreditCard,
  Lock,
} from "lucide-react";
import { emitToast } from "@/lib/toast";
import { launchRazorpayCheckout } from "@/lib/razorpay-checkout";

interface CaseDetailProps {
  paymentCase: PaymentCase | null;
  onClose: () => void;
  onCaseUpdated?: () => void;
  inline?: boolean;
}

// ── Human-readable root cause labels ────────────────────────────
const ROOT_CAUSE_LABELS: Record<string, string> = {
  insufficient_balance: "Insufficient Balance",
  bank_timeout: "Bank Timeout / 504",
  mandate_revoked: "Mandate Revoked",
  mandate_expired: "Mandate Expired",
  card_expired: "Card Expired",
  invalid_cvv: "Invalid CVV / Auth",
  upi_downtime: "UPI Switch Downtime",
  network_error: "Network / Connection Error",
  customer_abandoned: "Customer Abandoned",
  subscription_failed: "Subscription Charge Failed",
  unknown: "Unknown / Ambiguous",
};

// ── English Customer Recovery Messages per root cause (Professional & high-converting) ────
function generateEnglishMessage(paymentCase: PaymentCase, workingLink: string): string {
  const name = paymentCase.customer_name.split(" ")[0]; // First name
  const amount = formatCurrency(paymentCase.amount);
  const cause = paymentCase.root_cause || "unknown";

  const messages: Record<string, string> = {
    insufficient_balance: `Hello ${name}, your payment of ${amount} could not be processed due to insufficient account balance. You can easily complete your payment via this secure Razorpay link: ${workingLink}. Please feel free to reach out if you need assistance. Thank you!`,
    bank_timeout: `Hi ${name}, your payment of ${amount} timed out due to a temporary delay from your bank's server. No funds were deducted. Please retry and complete your payment here: ${workingLink}. It only takes a moment!`,
    card_expired: `Hello ${name}, your payment of ${amount} did not go through because the card on file has expired. Please update your card details or pay directly using this secure link: ${workingLink}. Thank you!`,
    invalid_cvv: `Hi ${name}, your payment of ${amount} could not be verified due to incorrect card details or CVV. Please verify your details and complete the transaction here: ${workingLink}.`,
    mandate_revoked: `Hello ${name}, your autopay recurring mandate is currently inactive, so the payment of ${amount} was paused. You can complete this payment manually using this secure link: ${workingLink}. Thank you!`,
    mandate_expired: `Hi ${name}, your autopay mandate has expired. Please complete your current payment of ${amount} using this link: ${workingLink}. You can also re-authorize autopay for future cycles.`,
    upi_downtime: `Hello ${name}, your UPI payment of ${amount} was interrupted due to a temporary outage with the UPI banking switch. You can complete your transaction using Card, Netbanking, or another UPI app here: ${workingLink}.`,
    network_error: `Hi ${name}, your payment of ${amount} was interrupted due to a temporary network connection issue. Please retry using this direct link: ${workingLink}.`,
    customer_abandoned: `Hello ${name}, we noticed your payment of ${amount} was left incomplete. Whenever you're ready, you can easily finish your payment using this link: ${workingLink}. We are here to help!`,
    subscription_failed: `Hi ${name}, your subscription renewal charge of ${amount} could not be processed. To keep your service active and uninterrupted, please complete payment here: ${workingLink}. Thank you!`,
    unknown: `Hello ${name}, your payment of ${amount} could not be completed due to a temporary technical issue. Please use this secure link to complete the payment: ${workingLink}. Thank you!`,
  };

  return messages[cause] || messages.unknown;
}

export function CaseDetail({ paymentCase, onClose, onCaseUpdated, inline = false }: CaseDetailProps) {
  const [copied, setCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [launchingRzp, setLaunchingRzp] = useState(false);

  const [realPaymentLink, setRealPaymentLink] = useState<string>("");
  const [loadingLink, setLoadingLink] = useState(false);

  const isRecovered = paymentCase?.status === "recovered" || simulated;

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

  useEffect(() => {
    if (paymentCase?.id) {
      fetchCaseLogs(paymentCase.id);
      setSimulated(false);

      if (
        paymentCase.payment_link_url &&
        (paymentCase.payment_link_url.includes("https://rzp.io/rzp/") ||
          paymentCase.payment_link_url.includes("https://rzp.io/i/plink_"))
      ) {
        setRealPaymentLink(paymentCase.payment_link_url);
      } else {
        setLoadingLink(true);
        fetch("/api/razorpay/create-payment-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ case_id: paymentCase.id }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.payment_link_url) {
              setRealPaymentLink(data.payment_link_url);
            }
          })
          .catch((err) => console.error("[Razorpay] Link fetch error:", err))
          .finally(() => setLoadingLink(false));
      }
    }
  }, [paymentCase?.id, paymentCase?.payment_link_url]);

  useEffect(() => {
    if (!paymentCase?.id || isRecovered) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cases/sync?case_id=${paymentCase.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.recovered) {
            setSimulated(true);
            fetchCaseLogs(paymentCase.id);
            if (onCaseUpdated) onCaseUpdated();
            emitToast(`Live Payment Verified via Razorpay! Case #${paymentCase.id.slice(0, 8)} marked as RECOVERED.`, "success", 5000);
          }
        }
      } catch {
        // silent polling catch
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentCase?.id, isRecovered, onCaseUpdated]);

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
        emitToast(`Payment of ${formatCurrency(paymentCase.amount)} successfully marked as RECOVERED! Audit ledger updated.`, "success", 5000);
      } else {
        emitToast("Failed to simulate payment. Please try again.", "error");
      }
    } catch (e) {
      console.error(e);
      emitToast("Network error while simulating payment.", "error");
    } finally {
      setSimulating(false);
    }
  };

  if (!paymentCase) return null;

  // Real, working Razorpay Hosted Payment Link (e.g. https://rzp.io/rzp/...)
  const workingPaymentLink =
    realPaymentLink ||
    (paymentCase.payment_link_url && paymentCase.payment_link_url.startsWith("https://rzp.io/")
      ? paymentCase.payment_link_url
      : "");

  const copyPaymentLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    emitToast("Razorpay payment link copied to clipboard!", "info", 3000);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFormattedMessage = () => {
    if (!workingPaymentLink) return englishMessage;
    const parts = englishMessage.split(workingPaymentLink);
    if (parts.length === 1) return englishMessage;
    return (
      <span>
        {parts[0]}
        <a
          href={workingPaymentLink}
          target="_blank"
          rel="noreferrer"
          className="text-[#0084FF] underline font-bold hover:text-[#38BDF8] break-all inline-flex items-center gap-1 cursor-pointer"
        >
          <span>{workingPaymentLink}</span>
          <ExternalLink className="w-3 h-3 inline shrink-0" />
        </a>
        {parts[1]}
      </span>
    );
  };
  const confidence = Math.round((paymentCase.diagnosis_confidence || 0.94) * 100);
  const rootCauseLabel = ROOT_CAUSE_LABELS[paymentCase.root_cause || "unknown"] || paymentCase.root_cause || "Unknown";
  const diagnosisMethodLabel = paymentCase.diagnosis_method === "llm_groq"
    ? "Groq AI (Llama 3.3 70B)"
    : "Rule Engine (Deterministic)";
  const englishMessage = generateEnglishMessage(paymentCase, workingPaymentLink);

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
          className="w-8 h-8 rounded-lg bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Amount Card with Simulate Paid button */}
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
              className="px-4 py-2.5 rounded-xl text-[12px] font-bold bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{simulating ? "Processing…" : "Simulate Customer Paid"}</span>
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
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#0084FF]" />
            <h4 className="text-[14px] font-bold text-[#F8FAFC]">
              Diagnosis & Confidence Meter
            </h4>
          </div>

          {/* Root cause and diagnostic method metadata */}
          <div className="p-3.5 rounded-xl border border-[#1C273E] bg-[#06080F] text-[12px] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-medium">Root Cause:</span>
              <span className="font-mono font-bold text-[#F8FAFC] bg-[#141C2E] px-2.5 py-0.5 rounded border border-[#1C273E]">
                {rootCauseLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-medium">Diagnosed By:</span>
              <span className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                paymentCase.diagnosis_method === "llm_groq"
                  ? "text-[#38BDF8] bg-[#0084FF]/10 border-[#0084FF]/30"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
              }`}>
                {diagnosisMethodLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-medium">Gateway Error Code:</span>
              <span className="font-mono font-bold text-[#F8FAFC] text-[11px]">{paymentCase.error_code}</span>
            </div>
            <div className="text-[12px] text-[#94A3B8] leading-relaxed italic pt-1 border-t border-[#1C273E]">
              &quot;{paymentCase.error_message}&quot;
            </div>
            {paymentCase.diagnosis_explanation && (
              <div className="text-[11px] text-[#64748B] leading-relaxed pt-1 border-t border-[#1C273E]">
                <span className="font-medium text-[#94A3B8]">Reasoning: </span>
                {paymentCase.diagnosis_explanation}
              </div>
            )}
          </div>

          {/* Confidence Progress Meter */}
          <div className="space-y-1.5">
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

        {/* Razorpay Recovery Link Section (Always Available) */}
        <div className="p-5 rounded-2xl border border-[#1C273E] bg-[#090D17] space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0084FF]" />
              <span className="text-[14px] font-bold text-[#F8FAFC]">
                Razorpay Recovery Link
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              TEST MODE
            </span>
          </div>

          {/* URL text row */}
          <div className="flex items-center gap-2 p-3 rounded-xl border border-[#1C273E] bg-[#06080F] font-mono text-[12px]">
            <span className="truncate flex-1 text-[#0084FF]">
              {loadingLink ? (
                <span className="text-[#64748B] flex items-center gap-1.5 font-sans italic">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0084FF]" />
                  Generating Razorpay live payment link…
                </span>
              ) : (
                workingPaymentLink
              )}
            </span>
            <button
              onClick={() => copyPaymentLink(workingPaymentLink)}
              disabled={loadingLink || !workingPaymentLink}
              className="p-1.5 rounded-lg bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={workingPaymentLink}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
              title="Open full page gateway"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Prominent Action Buttons: Pay via Razorpay + Open Page */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={async () => {
                setLaunchingRzp(true);
                emitToast("Opening Razorpay payment interface...", "info", 2500);
                const launched = await launchRazorpayCheckout({
                  amount: paymentCase.amount,
                  caseId: paymentCase.id,
                  customerName: paymentCase.customer_name,
                  customerEmail: paymentCase.customer_email,
                  customerPhone: paymentCase.customer_phone,
                  merchantName: paymentCase.merchant_id.replace("merchant_", "").toUpperCase(),
                  onSuccess: (res) => {
                    setSimulated(true);
                    fetchCaseLogs(paymentCase.id);
                    if (onCaseUpdated) onCaseUpdated();
                    emitToast(`Payment authorized via Razorpay (${res.razorpay_payment_id})! Marked as RECOVERED.`, "success", 5000);
                    setLaunchingRzp(false);
                  },
                  onDismiss: () => setLaunchingRzp(false),
                });
                if (!launched) setLaunchingRzp(false);
              }}
              disabled={launchingRzp}
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#0084FF] hover:bg-[#0070DB] text-white text-[13px] font-bold transition-all shadow-[0_0_18px_rgba(0,132,255,0.4)] hover:shadow-[0_0_24px_rgba(0,132,255,0.6)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {launchingRzp ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>{launchingRzp ? "Opening Razorpay…" : "Pay via Razorpay"}</span>
            </button>

            <a
              href={workingPaymentLink}
              target="_blank"
              rel="noreferrer"
              className="py-3.5 px-4 rounded-xl bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] text-[13px] font-semibold border border-[#1C273E] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Open Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Customer Recovery Message (English, Professional, Working link) */}
        <div className="p-5 rounded-2xl border border-[#1C273E] bg-[#090D17] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#0084FF]" />
              <h4 className="text-[14px] font-bold text-[#F8FAFC]">
                Customer Recovery Message
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0084FF]/10 text-[#38BDF8] border border-[#0084FF]/30">
              English · WhatsApp / SMS
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[#1C273E] bg-[#06080F] text-[13px] text-[#94A3B8] leading-relaxed whitespace-pre-wrap font-sans">
            {renderFormattedMessage()}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(englishMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 text-[12px] font-semibold transition-colors cursor-pointer border border-emerald-500/30"
              title="Open message in WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </a>

            <button
              onClick={() => {
                navigator.clipboard.writeText(englishMessage);
                setMsgCopied(true);
                emitToast("Customer recovery message copied to clipboard!", "info", 3000);
                setTimeout(() => setMsgCopied(false), 2000);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] text-[12px] font-semibold transition-colors cursor-pointer border border-[#1C273E]"
            >
              {msgCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{msgCopied ? "Copied!" : "Copy Message"}</span>
            </button>
          </div>
        </div>

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
          className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#141C2E] hover:bg-[#18233A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
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
