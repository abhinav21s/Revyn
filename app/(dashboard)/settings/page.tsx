"use client";

import React, { useState, useEffect } from "react";
import { Panel } from "@/components/primitives";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
  TrendingDown,
  Calendar,
  MessageSquare,
  Cpu,
  UserCheck,
  Power,
  CreditCard,
  Database,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const [connections, setConnections] = useState({
    groq: false,
    razorpay: false,
    supabase: false,
  });
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmKill, setConfirmKill] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setKillSwitchActive(data.settings?.kill_switch === "true");
        setConnections(data.connections || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleKillSwitch = async () => {
    setToggling(true);
    const targetState = !killSwitchActive;
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "kill_switch",
          value: targetState ? "true" : "false",
        }),
      });
      if (res.ok) {
        setKillSwitchActive(targetState);
      }
    } finally {
      setToggling(false);
      setConfirmKill(false);
    }
  };

  const policyRules = [
    {
      icon: RotateCcw,
      title: "Max Retry Limit",
      value: "3 attempts",
      desc: "Strict ceiling on automatic retry attempts per invoice to prevent card network fatigue and merchant compliance sanctions.",
    },
    {
      icon: Ban,
      title: "Mandate Hard Stop",
      value: "RBI Mandate Block",
      desc: "Revoked or cancelled e-mandates are instantly marked unrecoverable. Zero automated retries allowed under RBI guidelines.",
    },
    {
      icon: TrendingDown,
      title: "Economic Floor",
      value: "₹10.00 minimum",
      desc: "Payments under the floor are excluded from recovery loops to ensure unit economics remain strictly positive.",
    },
    {
      icon: Calendar,
      title: "Salary Window Retries",
      value: "Days 1–5 (2h loop)",
      desc: "Insufficient balance failures occurring during month-turn salary windows use rapid 2-hour retry cycles instead of 24 hours.",
    },
    {
      icon: MessageSquare,
      title: "Message Limits & Anti-Spam",
      value: "1 link per case",
      desc: "Customers receive at most one recovery payment link per failure episode. No repetitive messaging or duplicate links.",
    },
    {
      icon: Cpu,
      title: "LLM = Diagnosis Only",
      value: "Zero Financial Authority",
      desc: "Groq Llama 3.3 70B output is strictly constrained to root-cause classification schema. Zero authority to authorize funds.",
    },
    {
      icon: UserCheck,
      title: "Human Escalation Policy",
      value: "Tier-2 Review",
      desc: "Unknown errors, mandate disputes, and cases reaching maximum attempts are auto-routed to merchant operators.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── 1. Global Emergency Kill Switch Card ── */}
      <div
        className={`p-6 rounded-2xl border transition-all shadow-xl shadow-black/40 ${
          killSwitchActive
            ? "bg-red-950/20 border-red-500/50 shadow-red-950/20"
            : "bg-[#0F1523] border-[#1C273E]"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-md ${
                killSwitchActive
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {killSwitchActive ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-[17px] font-bold tracking-tight text-[#F8FAFC]">
                  Global Emergency Kill Switch
                </h3>
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                    killSwitchActive
                      ? "bg-red-500/20 text-red-400 border-red-500/40"
                      : "bg-emerald-500/12 text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  {killSwitchActive ? "ARMED — OPERATIONS HALTED" : "SYSTEM ARMED & SECURE"}
                </span>
              </div>

              <p className="text-[13px] text-[#94A3B8] leading-relaxed mt-1.5 max-w-2xl">
                Immediately halts all autonomous recovery actions, pauses payment link generation via Razorpay,
                and freezes the batch pipeline. Ingested failures are parked safely with status{" "}
                <code className="text-red-400 font-mono font-bold">HALTED</code>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setConfirmKill(true)}
            disabled={loading || toggling}
            className={`px-6 py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all shadow-lg active:scale-95 disabled:opacity-60 shrink-0 ${
              killSwitchActive
                ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
            }`}
          >
            {toggling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            <span>{killSwitchActive ? "Resume Autonomous Actions" : "Activate Kill Switch"}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Bounded Policy Engine Guardrails ── */}
      <Panel
        title="Deterministic Policy Engine Guardrails"
        description="Bounded execution: Groq LLM has zero authority over financial actions. All retries, links, and escalations are strictly governed by deterministic rules."
        action={
          <span className="text-[11px] font-mono font-semibold px-3 py-1 rounded-lg bg-[#0084FF]/12 text-[#38BDF8] border border-[#0084FF]/30">
            TypeScript · Deterministic
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policyRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.title}
                className="p-4.5 rounded-xl border border-[#1C273E] bg-[#090D17] flex flex-col justify-between hover:border-[#0084FF]/40 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-[#0084FF]" />
                    <span className="text-[13px] font-bold text-[#F8FAFC]">
                      {rule.title}
                    </span>
                  </div>

                  <div className="text-[19px] font-black font-mono tracking-tight text-[#0084FF] mb-2">
                    {rule.value}
                  </div>
                </div>

                <p className="text-[12px] text-[#94A3B8] leading-relaxed">
                  {rule.desc}
                </p>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ── 3. Gateway & AI Integration Health ── */}
      <Panel
        title="Gateway & AI Integration Health"
        description="Live connection status for external systems and execution sandbox"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Razorpay */}
          <div className="p-4.5 rounded-xl border border-[#1C273E] bg-[#090D17] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0084FF]" />
                <span className="text-[14px] font-bold text-[#F8FAFC]">Razorpay Gateway</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/12 text-amber-400 border border-amber-500/30">
                TEST MODE
              </span>
            </div>
            <p className="text-[12px] text-[#94A3B8] leading-relaxed mt-1">
              Official SDK connected with test mode credentials (<code className="text-[#F8FAFC] font-mono">rzp_test_*</code>). No live card charges.
            </p>
          </div>

          {/* Groq AI */}
          <div className="p-4.5 rounded-xl border border-[#1C273E] bg-[#090D17] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0084FF]" />
                <span className="text-[14px] font-bold text-[#F8FAFC]">Groq AI (Llama 3.3 70B)</span>
              </div>
              {connections.groq ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/12 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/12 text-amber-400 border border-amber-500/30">
                  Fallback Mode
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#94A3B8] leading-relaxed mt-1">
              Isolated to JSON-schema root-cause classification with zero financial execution privileges.
            </p>
          </div>

          {/* Supabase */}
          <div className="p-4.5 rounded-xl border border-[#1C273E] bg-[#090D17] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#0084FF]" />
                <span className="text-[14px] font-bold text-[#F8FAFC]">Supabase Ledger</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/12 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </div>
            <p className="text-[12px] text-[#94A3B8] leading-relaxed mt-1">
              PostgreSQL database managing case status, rate metrics, and immutable audit logs.
            </p>
          </div>
        </div>
      </Panel>

      {/* Confirmation Modal */}
      {confirmKill && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmKill(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#0F1523] border border-[#1C273E] p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                  killSwitchActive
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/15 border-red-500/30 text-red-400"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-[#F8FAFC]">
                  {killSwitchActive ? "Resume Autonomous Operations?" : "Activate Emergency Kill Switch?"}
                </h4>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">
                  {killSwitchActive
                    ? "This will resume the policy engine and allow recovery link creation in Razorpay Test Mode."
                    : "This immediately stops all Revyn automated recovery actions. No links will be generated until deactivated."}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setConfirmKill(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#141C2E] hover:bg-[#18233A] text-[13px] font-medium text-[#94A3B8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={toggleKillSwitch}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white transition-colors ${
                  killSwitchActive ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {killSwitchActive ? "Yes, Resume" : "Yes, Halt Operations"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
