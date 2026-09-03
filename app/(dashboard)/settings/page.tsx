"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { KillSwitchControl } from "@/components/kill-switch";
import {
  ShieldCheck,
  CheckCircle2,
  Info,
  Lock,
  Cpu,
  CreditCard,
  Database,
  RotateCcw,
  TrendingDown,
  Calendar,
  Ban,
} from "lucide-react";

export default function SettingsPage() {
  const [connections, setConnections] = useState({
    groq: false,
    razorpay: false,
    supabase: false,
  });
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const policyRules = [
    {
      icon: RotateCcw,
      color: "blue",
      title: "Max Retry Limit",
      value: "3 attempts",
      desc: "Any case reaching 3 retries is immediately escalated to human review to prevent customer fatigue and compliance issues.",
    },
    {
      icon: TrendingDown,
      color: "amber",
      title: "Economic Floor",
      value: "₹10.00 minimum",
      desc: "Payments below the floor are marked unrecoverable to ensure recovery costs never exceed the recovered value.",
    },
    {
      icon: Ban,
      color: "rose",
      title: "Mandate Hard Stop",
      value: "Revoked / Expired",
      desc: "Cancelled or expired UPI AutoPay mandates are never automatically retried, in compliance with RBI guidelines.",
    },
    {
      icon: Calendar,
      color: "emerald",
      title: "Salary Day Window",
      value: "Days 1–5 of month",
      desc: "Insufficient balance cases in salary periods use a rapid 2-hour retry window instead of the standard 24-hour delay.",
    },
  ];

  const colorMap: Record<string, { icon: string; border: string; bg: string }> = {
    blue: { icon: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/8" },
    amber: { icon: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/8" },
    rose: { icon: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/8" },
    emerald: { icon: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/8" },
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <TopBar
        title="Settings & Safety Guardrails"
        subtitle="Policy rules, emergency kill switch, and gateway connection status"
      />

      {/* Emergency Kill Switch */}
      <KillSwitchControl
        initialActive={killSwitchActive}
        onStateChanged={(val) => setKillSwitchActive(val)}
      />

      {/* Policy Engine Rules */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#374151]/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white tracking-tight">
                Deterministic Policy Engine Rules
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Hard-coded TypeScript guardrails — the LLM has zero authority over these
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
            Immutable · TypeScript
          </span>
        </div>

        <p className="text-xs text-zinc-400 opacity-75 leading-relaxed">
          Groq AI (Llama 3.3 70B) is strictly isolated to root-cause classification only.
          All money-moving decisions — retries, payment links, escalations — are governed entirely by these deterministic rules:
        </p>

        {/* 2x2 Grid with 16px gap, each card 16px padding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {policyRules.map((rule) => {
            const Icon = rule.icon;
            const c = colorMap[rule.color];
            return (
              <div
                key={rule.title}
                className={`p-4 rounded-xl bg-[#0B0F19] border ${c.border} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${c.icon}`} />
                      <span className="text-sm font-semibold text-zinc-200">{rule.title}</span>
                    </div>
                    <span className={`text-[11px] font-bold font-mono ${c.icon} ${c.bg} px-2 py-0.5 rounded-md border ${c.border}`}>
                      {rule.value}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 opacity-75 leading-relaxed mt-1">{rule.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integration Health */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#374151]/60 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white tracking-tight">
              Gateway & AI Integration Health
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Real-time connection status for all external services</p>
          </div>
        </div>

        {/* Three cards with 16px gap, equal height, status badge aligned top-right */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Razorpay */}
          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#374151]/60 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-white">Razorpay</span>
                </div>
                {connections.razorpay ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Info className="w-3 h-3" /> Needs Key
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 opacity-75 leading-relaxed">
                Official Node.js SDK with <code className="text-zinc-300">rzp_test_*</code> credentials only. No live payments.
              </p>
            </div>
          </div>

          {/* Groq AI */}
          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#374151]/60 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white">Groq AI</span>
                </div>
                {connections.groq ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Info className="w-3 h-3" /> Needs Key
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 opacity-75 leading-relaxed">
                Llama 3.3 70B for diagnosis only. Forced JSON schema with zero execution authority.
              </p>
            </div>
          </div>

          {/* Supabase */}
          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#374151]/60 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Supabase</span>
                </div>
                {connections.supabase ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Info className="w-3 h-3" /> Needs Key
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 opacity-75 leading-relaxed">
                PostgreSQL database holding all cases, settings, and the immutable audit ledger.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
