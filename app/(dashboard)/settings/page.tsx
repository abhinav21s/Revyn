"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { KillSwitchControl } from "@/components/kill-switch";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Cpu,
  CreditCard,
  Database,
  Info,
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

  return (
    <div className="space-y-6">
      <TopBar
        title="Settings & Safety Guardrails"
        subtitle="Policy rules, emergency kill switch, and gateway connection status"
      />

      {/* Emergency Kill Switch Control */}
      <KillSwitchControl
        initialActive={killSwitchActive}
        onStateChanged={(val) => setKillSwitchActive(val)}
      />

      {/* Policy Engine Rules Overview (Read-Only Guardrails) */}
      <div className="p-6 rounded-xl bg-[#111827] border border-[#1F2937] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Deterministic Policy Engine Guardrails
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
            Hard-Coded TypeScript Rules
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          The LLM (Groq) is strictly isolated to root-cause diagnosis. All money-moving, retry scheduling, and escalation decisions are governed deterministically by the rules below:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200">
                1. Max Retry Limit
              </span>
              <span className="font-mono text-blue-400 font-bold">3 attempts</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Any case reaching 3 retries is immediately halted and escalated to human review to prevent customer fatigue.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200">
                2. Economic Floor
              </span>
              <span className="font-mono text-blue-400 font-bold">₹10.00 (1000 paise)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Payments below the economic threshold are marked unrecoverable to ensure recovery costs never exceed recovered value.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200">
                3. Mandate Hard Stops
              </span>
              <span className="font-mono text-rose-400 font-bold">
                Revoked / Expired
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              AutoPay mandates that have been cancelled or expired by the customer are never automatically retried (RBI compliance).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200">
                4. Salary Day Windows
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                Days 1–5 of month
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Insufficient balance cases during salary credit periods are retried on a rapid 2-hour window instead of 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Connections Status */}
      <div className="p-6 rounded-xl bg-[#111827] border border-[#1F2937] space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Gateway & AI Integration Health
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Razorpay Test Mode */}
          <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Razorpay</span>
              </div>
              {connections.razorpay ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Ready (Test Mode)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Info className="w-3 h-3" /> Needs Env Key
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Official Node.js SDK configured with <code className="text-zinc-300">rzp_test_*</code> credentials.
            </p>
          </div>

          {/* Groq AI */}
          <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Groq AI</span>
              </div>
              {connections.groq ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Info className="w-3 h-3" /> Needs Env Key
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Forced JSON schema diagnosis classification only (Zero money authority).
            </p>
          </div>

          {/* Supabase PostgreSQL */}
          <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#1F2937] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Supabase</span>
              </div>
              {connections.supabase ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Info className="w-3 h-3" /> Needs Env Key
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              PostgreSQL database holding cases, settings, and immutable audit logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
