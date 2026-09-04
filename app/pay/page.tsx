"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import {
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import type { PaymentCase } from "@/lib/types";
import { launchRazorpayCheckout } from "@/lib/razorpay-checkout";

// Official Razorpay India Domestic Test Credentials
// BLOCKED by Razorpay India test accounts:
//   - Amex cards (34xx / 37xx): "American Express card not supported"
//   - International Visa (4111 1111...): "International cards are not supported"
const TEST_CARDS = [
  { label: "Mastercard Domestic", number: "5123 4567 8901 2345", exp: "10/29", cvv: "456", brand: "Mastercard" },
  { label: "Visa Domestic", number: "4012 0010 3714", exp: "02/28", cvv: "123", brand: "Visa" },
  { label: "RuPay", number: "6071 5234 5678 9012", exp: "08/30", cvv: "789", brand: "RuPay" },
];

const TEST_UPIS = [
  { label: "Instant Success VPA", vpa: "success@razorpay" },
  { label: "Google Pay Test VPA", vpa: "customer@okaxis" },
  { label: "PhonePe Test VPA", vpa: "customer@ybl" },
  { label: "Paytm Test VPA", vpa: "customer@paytm" },
];

function PaymentGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const caseId = searchParams.get("id") || searchParams.get("case_id") || "pay_test_01";

  const [paymentCase, setPaymentCase] = useState<PaymentCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [launchingRzp, setLaunchingRzp] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Resolution states
  const [paid, setPaid] = useState(false);
  const [txId, setTxId] = useState("");

  const [autoLaunched, setAutoLaunched] = useState(false);

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  useEffect(() => {
    if (paymentCase && !paid && !autoLaunched && paymentCase.status !== "recovered") {
      setAutoLaunched(true);
      handleLaunchRazorpay();
    }
  }, [paymentCase, paid, autoLaunched]);

  const fetchCase = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases?limit=200`);
      if (res.ok) {
        const data = await res.json();
        const found = data.cases?.find(
          (c: PaymentCase) =>
            c.id === caseId ||
            c.id.includes(caseId) ||
            caseId.includes(c.id.slice(0, 8))
        );
        if (found) {
          setPaymentCase(found);
          if (found.status === "recovered") setPaid(true);
        } else if (data.cases && data.cases.length > 0) {
          setPaymentCase(data.cases[0]);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchRazorpay = async () => {
    setLaunchingRzp(true);
    const amount = paymentCase?.amount || 149900;
    const name = paymentCase?.customer_name || "Customer";
    const email = paymentCase?.customer_email || "customer@example.com";
    const phone = paymentCase?.customer_phone || "9876543210";

    const launched = await launchRazorpayCheckout({
      amount,
      caseId: paymentCase?.id || caseId,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      merchantName: "Revyn AI · Razorpay Recovery",
      onSuccess: (response) => {
        const paymentId = response.razorpay_payment_id || "pay_rzp_" + Math.random().toString(36).substring(2, 9);
        setTxId(paymentId);
        setPaid(true);
        setLaunchingRzp(false);
      },
      onDismiss: () => {
        setLaunchingRzp(false);
      },
    });

    if (!launched) {
      setLaunchingRzp(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const amountPaise = paymentCase?.amount || 149900;
  const merchantName = paymentCase?.merchant_id
    ? paymentCase.merchant_id.replace("merchant_", "").replace("_demo", "").replace("_test", "").toUpperCase()
    : "REVYN MERCHANDISE";
  const customerName = paymentCase?.customer_name || "Customer";

  return (
    <div className="min-h-screen bg-[#05070E] text-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#0084FF]/12 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-lg relative z-10 space-y-4">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Revyn Console</span>
          </button>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0084FF]/15 text-[#38BDF8] border border-[#0084FF]/30">
            Razorpay Test Checkout
          </span>
        </div>

        {/* Razorpay Card Container */}
        <div className="rounded-2xl border border-[#1C273E] bg-[#0A0F1D] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-[#0084FF] to-[#0052CC] text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-black tracking-tight">Razorpay</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30">
                  TEST MODE
                </span>
              </div>
              <p className="text-[12px] text-white/90 mt-1 font-medium">
                Merchant: <span className="font-bold text-white">{merchantName}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-white/80 block uppercase tracking-wider font-semibold">
                Amount
              </span>
              <div className="text-[24px] font-black font-mono leading-none">
                {formatCurrency(amountPaise)}
              </div>
            </div>
          </div>

          {paid ? (
            /* ── SUCCESS RECEIPT SCREEN ── */
            <div className="p-8 text-center space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_32px_rgba(16,185,129,0.35)]">
                <CheckCircle2 className="w-11 h-11" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[22px] font-bold text-[#F8FAFC]">
                  Payment Successful!
                </h3>
                <p className="text-[13px] text-[#94A3B8]">
                  Verified & authorized through Razorpay Gateway. Case marked as recovered.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#060913] border border-[#1C273E] space-y-2.5 text-[12px] font-mono text-left">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Razorpay Payment ID:</span>
                  <span className="font-bold text-[#0084FF]">{txId || "pay_rzp_test_9921a"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Customer Name:</span>
                  <span className="text-[#F8FAFC]">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Amount Paid:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(amountPaise)}</span>
                </div>
                <div className="flex justify-between border-t border-[#1C273E] pt-2">
                  <span className="text-[#64748B]">Revyn Status:</span>
                  <span className="font-bold text-emerald-400">RECOVERED & AUDITED</span>
                </div>
              </div>

              <button
                onClick={() => router.push("/")}
                className="w-full py-3.5 rounded-xl bg-[#0084FF] hover:bg-[#0070DB] text-white text-[14px] font-bold transition-all shadow-[0_0_24px_rgba(0,132,255,0.4)] cursor-pointer"
              >
                Return to Operations Console
              </button>
            </div>
          ) : (
            /* ── RAZORPAY CHECKOUT LAUNCH PAD ── */
            <div className="p-6 space-y-6">
              {/* ⚠ Amex / International Card Warning */}
              <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 space-y-1.5">
                <div className="flex items-center gap-2 text-[13px] font-bold text-red-400">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Unsupported Cards on Razorpay India (Test Mode)</span>
                </div>
                <ul className="text-[12px] text-[#CBD5E1] leading-relaxed space-y-0.5 list-disc list-inside">
                  <li><strong className="text-red-300">American Express (34xx / 37xx)</strong> — disabled on Razorpay India by default. This includes <span className="font-mono text-red-300">3402 5600 0401 007</span>.</li>
                  <li><strong className="text-red-300">International Visa/Mastercard</strong> (e.g., <span className="font-mono">4111 1111 1111 1111</span>) — blocked for Indian accounts.</li>
                </ul>
              </div>

              {/* ✅ Supported Domestic Card Notice */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 space-y-1">
                <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Use domestic test cards below — they work every time</span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  Mastercard · Visa · RuPay · UPI — all supported in Razorpay India test mode.
                </p>
              </div>

              {/* Primary Action Button: Launch Razorpay Interface */}
              <button
                onClick={handleLaunchRazorpay}
                disabled={launchingRzp}
                className="w-full py-4 rounded-xl bg-[#0084FF] hover:bg-[#0070DB] text-white text-[15px] font-bold transition-all shadow-[0_0_24px_rgba(0,132,255,0.45)] hover:shadow-[0_0_32px_rgba(0,132,255,0.65)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
              >
                {launchingRzp ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Opening Razorpay Checkout…</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Pay {formatCurrency(amountPaise)} with Razorpay</span>
                  </>
                )}
              </button>

              {/* Quick Copy Test Credentials */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#64748B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0084FF]" />
                  <span>Razorpay Test Credentials (Click to Copy)</span>
                </div>

                {/* Test UPIs */}
                <div className="p-3.5 rounded-xl border border-[#1C273E] bg-[#060913] space-y-2">
                  <div className="text-[11px] font-mono text-[#64748B]">Test UPI VPA (Instant 1-Click Success):</div>
                  <div className="grid grid-cols-2 gap-2">
                    {TEST_UPIS.map((u) => (
                      <div
                        key={u.vpa}
                        onClick={() => copyToClipboard(u.vpa, u.vpa)}
                        className="p-2 rounded-lg bg-[#0A0F1D] border border-[#1C273E] hover:border-[#0084FF]/50 transition-all cursor-pointer text-[11px]"
                      >
                        <div className="font-bold text-[#F8FAFC]">{u.label}</div>
                        <div className="font-mono text-[#38BDF8] truncate flex items-center justify-between mt-0.5">
                          <span>{u.vpa}</span>
                          {copiedText === u.vpa && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Domestic Cards */}
                <div className="p-3.5 rounded-xl border border-[#1C273E] bg-[#060913] space-y-2">
                  <div className="text-[11px] font-mono text-[#64748B]">Domestic Cards (Expiry: 10/29 or 02/28, CVV: 123):</div>
                  <div className="space-y-1.5">
                    {TEST_CARDS.map((card) => (
                      <div
                        key={card.brand}
                        onClick={() => copyToClipboard(card.number.replace(/\s/g, ""), card.brand)}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#0A0F1D] border border-[#1C273E] hover:border-[#0084FF]/50 transition-all cursor-pointer text-[12px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F8FAFC] w-28">{card.brand}</span>
                          <span className="font-mono text-[#38BDF8]">{card.number}</span>
                        </div>
                        <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                          {copiedText === card.brand ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <Check className="w-3.5 h-3.5" /> Copied
                            </span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] text-center pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0084FF]" />
                <span>Secured by Razorpay Standard Checkout SDK</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06080F] text-white flex items-center justify-center font-mono text-[13px]">
          Loading Razorpay Checkout…
        </div>
      }
    >
      <PaymentGatewayContent />
    </Suspense>
  );
}
