"use client";

import React, { useState, useEffect } from "react";
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
      title: "Max Retry Limit",
      value: "3 attempts",
      desc: "Any case reaching 3 retries is immediately escalated to human review to prevent customer fatigue and compliance issues.",
    },
    {
      icon: TrendingDown,
      title: "Economic Floor",
      value: "₹10.00 minimum",
      desc: "Payments below the floor are marked unrecoverable to ensure recovery costs never exceed the recovered value.",
    },
    {
      icon: Ban,
      title: "Mandate Hard Stop",
      value: "Revoked / Expired",
      desc: "Cancelled or expired UPI AutoPay mandates are never automatically retried, in compliance with RBI guidelines.",
    },
    {
      icon: Calendar,
      title: "Salary Day Window",
      value: "Days 1–5 of month",
      desc: "Insufficient balance cases in salary periods use a rapid 2-hour retry window instead of the standard 24-hour delay.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[28px] font-bold text-[#F4F6FA] tracking-[-0.02em] leading-tight">
          Settings & Safety Guardrails
        </h1>
        <p className="text-[14px] text-[#94A3B8] leading-[1.5] mt-1">
          Configure safety parameters, emergency kill switch, and view API integration health.
        </p>
      </div>

      {/* Emergency Kill Switch */}
      <KillSwitchControl
        initialActive={killSwitchActive}
        onStateChanged={(val) => setKillSwitchActive(val)}
      />

      {/* Deterministic Policy Engine Rules */}
      <div className="p-6 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[rgba(79,124,255,0.1)] border border-[rgba(79,124,255,0.25)] flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#4F7CFF]" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#F4F6FA] tracking-tight">
                Deterministic Policy Engine Rules
              </h3>
              <p className="text-[13px] text-[#94A3B8]">
                Bounded execution: Groq LLM has zero authority over financial actions
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-mono font-medium px-2.5 py-1 rounded-[6px] bg-[rgba(79,124,255,0.1)] text-[#4F7CFF] border border-[rgba(79,124,255,0.25)]">
            TypeScript · Deterministic
          </span>
        </div>

        <p className="text-[13px] text-[#94A3B8] leading-relaxed">
          Groq AI (Llama 3.3 70B) is strictly sandboxed to root-cause diagnosis. All decisions (retries, payment links, human escalations) are enforced by hardcoded policy rules:
        </p>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {policyRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.title}
                className="p-4 rounded-[8px] bg-[#0B0F19] border border-[#2E3A52] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#4F7CFF]" />
                    <span className="text-[14px] font-medium text-[#F4F6FA]">{rule.title}</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#4F7CFF] bg-[rgba(79,124,255,0.1)] border border-[rgba(79,124,255,0.25)] px-2 py-0.5 rounded-[4px]">
                    {rule.value}
                  </span>
                </div>
                <p className="text-[12px] text-[#94A3B8] leading-normal mt-1">{rule.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integration Health */}
      <div className="p-6 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#0F2A1C] border border-[rgba(34,197,94,0.3)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#F4F6FA] tracking-tight">
              Gateway & AI Integration Health
            </h3>
            <p className="text-[13px] text-[#94A3B8]">Live connection status for external systems</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Razorpay */}
          <div className="p-4 rounded-[8px] bg-[#0B0F19] border border-[#2E3A52] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#4F7CFF]" />
                <span className="text-[14px] font-medium text-[#F4F6FA]">Razorpay</span>
              </div>
              {connections.razorpay ? (
                <span className="text-[11px] font-medium text-[#22C55E] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="text-[11px] font-medium text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                  <Info className="w-3 h-3" /> Test Mode
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#94A3B8] leading-normal">
              Official SDK initialized with test credentials (<code className="text-[#F4F6FA]">rzp_test_*</code>).
            </p>
          </div>

          {/* Groq AI */}
          <div className="p-4 rounded-[8px] bg-[#0B0F19] border border-[#2E3A52] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#4F7CFF]" />
                <span className="text-[14px] font-medium text-[#F4F6FA]">Groq AI</span>
              </div>
              {connections.groq ? (
                <span className="text-[11px] font-medium text-[#22C55E] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="text-[11px] font-medium text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                  <Info className="w-3 h-3" /> Needs Key
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#94A3B8] leading-normal">
              Llama 3.3 70B Versatile with strict JSON Schema output.
            </p>
          </div>

          {/* Supabase */}
          <div className="p-4 rounded-[8px] bg-[#0B0F19] border border-[#2E3A52] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#4F7CFF]" />
                <span className="text-[14px] font-medium text-[#F4F6FA]">Supabase</span>
              </div>
              {connections.supabase ? (
                <span className="text-[11px] font-medium text-[#22C55E] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="text-[11px] font-medium text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                  <Info className="w-3 h-3" /> Needs Key
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#94A3B8] leading-normal">
              PostgreSQL database holding cases, ledger, and state.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
