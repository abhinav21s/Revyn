"use client";

import React, { useState, useEffect } from "react";
import { KillSwitchControl } from "@/components/kill-switch";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";

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
      title: "Max Retry Limit",
      value: "3 attempts",
      desc: "Any case reaching 3 retries is immediately escalated to human review to prevent customer fatigue and compliance issues.",
    },
    {
      title: "Economic Floor",
      value: "₹10.00 minimum",
      desc: "Payments below the floor are marked unrecoverable to ensure recovery costs never exceed the recovered value.",
    },
    {
      title: "Mandate Hard Stop",
      value: "Revoked / Expired",
      desc: "Cancelled or expired UPI AutoPay mandates are never automatically retried, in compliance with RBI guidelines.",
    },
    {
      title: "Salary Day Window",
      value: "Days 1–5 of month",
      desc: "Insufficient balance cases in salary periods use a rapid 2-hour retry window instead of the standard 24-hour delay.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Title block: H1 28px/700 mb-2, Subtext 14px mb-8 (32px air before first card) ── */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#F4F6FA] tracking-[-0.02em] leading-tight mb-2">
          Settings & Safety Guardrails
        </h1>
        <p className="text-[14px] text-[#94A3B8] leading-[1.5]">
          Configure safety parameters, emergency kill switch, and view API integration health.
        </p>
      </div>

      {/* ── CARD 1: Emergency Kill Switch (own card, padding: 24px, mb-6) ── */}
      <KillSwitchControl
        initialActive={killSwitchActive}
        onStateChanged={(val) => setKillSwitchActive(val)}
      />

      {/* ── CARD 2: Deterministic Policy Engine Rules (padding: 24px, mb-6) ── */}
      <div className="p-6 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.3)] shadow-sm">
        {/* Header: title + "TypeScript · Deterministic" tag pill on same row, mb-2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h3 className="text-[16px] font-semibold text-[#F4F6FA] tracking-tight">
            Deterministic Policy Engine Rules
          </h3>
          <span className="self-start sm:self-auto text-[11px] font-mono font-medium px-2.5 py-1 rounded-[6px] bg-[#1A2233] text-[#4F7CFF] border border-[#2E3A52]">
            TypeScript · Deterministic
          </span>
        </div>

        {/* Subtext: 14px --text-secondary, mb-6 */}
        <p className="text-[14px] text-[#94A3B8] leading-[1.5] mb-6">
          Bounded execution: Groq LLM has zero authority over financial actions. All retries, payment links, and escalations are enforced by deterministic rules:
        </p>

        {/* 2x2 Grid (16px gap, single column on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policyRules.map((rule) => (
            <div
              key={rule.title}
              className="p-4 rounded-[8px] bg-[#0B0F19] border border-[rgba(38,48,69,0.3)] flex flex-col justify-between"
            >
              <div>
                <div className="text-[13px] text-[#94A3B8] font-medium mb-1">
                  {rule.title}
                </div>
                <div className="text-[20px] font-bold text-[#F4F6FA] font-mono mb-2">
                  {rule.value}
                </div>
              </div>
              <p className="text-[12px] text-[#5B6B85] leading-[1.5]">
                {rule.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARD 3: Gateway & AI Integration Health (padding: 24px, mb-6) ── */}
      <div className="p-6 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.3)] shadow-sm">
        {/* Header: title + "Live connection status..." subtext, mb-5 */}
        <div className="mb-5">
          <h3 className="text-[16px] font-semibold text-[#F4F6FA] tracking-tight mb-1">
            Gateway & AI Integration Health
          </h3>
          <p className="text-[13px] text-[#94A3B8]">
            Live connection status for external systems and execution sandbox
          </p>
        </div>

        {/* 3-column Grid (16px gap, single column on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Razorpay */}
          <div className="p-4 rounded-[8px] bg-[#0B0F19] border border-[rgba(38,48,69,0.3)] flex flex-col justify-between">
            {/* Row 1: Name (14px/600) + Status pill space-between */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-semibold text-[#F4F6FA]">Razorpay</span>
              {connections.razorpay ? (
                <span className="text-[11px] font-medium text-[#22C55E] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="text-[11px] font-medium text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Info className="w-3 h-3" /> Test Mode
                </span>
              )}
            </div>
            {/* Row 2 (mt-2): description 12px, --text-muted, line-height: 1.5 */}
            <p className="text-[12px] text-[#5B6B85] leading-[1.5] mt-2">
              Official SDK connected with test mode credentials (<code className="text-[#94A3B8] font-mono">rzp_test_*</code>). No live card charges.
            </p>
          </div>

          {/* Groq AI */}
          <div className="p-4 rounded-[8px] bg-[#0B0F19] border border-[rgba(38,48,69,0.3)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-semibold text-[#F4F6FA]">Groq AI</span>
              {connections.groq ? (
                <span className="text-[11px] font-medium text-[#22C55E] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="text-[11px] font-medium text-[#EF4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Needs Key
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#5B6B85] leading-[1.5] mt-2">
              Llama 3.3 70B Versatile isolated to classification with strict JSON Schema output.
            </p>
          </div>

          {/* Supabase */}
          <div className="p-4 rounded-[8px] bg-[#0B0F19] border border-[rgba(38,48,69,0.3)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-semibold text-[#F4F6FA]">Supabase</span>
              {connections.supabase ? (
                <span className="text-[11px] font-medium text-[#22C55E] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="text-[11px] font-medium text-[#EF4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Needs Key
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#5B6B85] leading-[1.5] mt-2">
              PostgreSQL database managing case status, rate metrics, and immutable audit logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
