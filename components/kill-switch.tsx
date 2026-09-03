"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Power,
} from "lucide-react";

interface KillSwitchControlProps {
  initialActive?: boolean;
  onStateChanged?: (active: boolean) => void;
}

export function KillSwitchControl({
  initialActive = false,
  onStateChanged,
}: KillSwitchControlProps) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleKillSwitch = async (newVal: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "kill_switch",
          value: newVal ? "true" : "false",
        }),
      });

      if (res.ok) {
        setActive(newVal);
        if (onStateChanged) onStateChanged(newVal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      {/* ── CARD: Emergency Kill Switch (padding: 24px, border-radius: 12px, bg: --bg-surface, border: 1px solid --border-subtle) ── */}
      <div
        className={`p-6 rounded-[12px] border transition-all ${
          active
            ? "bg-[rgba(220,38,38,0.1)] border-[#DC2626]/40"
            : "bg-[#121826] border-[rgba(38,48,69,0.3)]"
        }`}
      >
        {/* Header row: title 16px/600 + status pill on same row, space-between, margin-bottom 12px */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {active && <ShieldAlert className="w-5 h-5 text-[#DC2626] animate-pulse" />}
            <h3 className="text-[16px] font-semibold text-[#F4F6FA] leading-none">
              Emergency Kill Switch
            </h3>
          </div>

          {/* Status pill: padding 4px 12px, border-radius 999px, font-size 12px, dot + label */}
          <div>
            {active ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(220,38,38,0.15)] text-[#DC2626] border border-[rgba(220,38,38,0.3)] text-[12px] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                <span>KILL SWITCH ACTIVE — All operations halted</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F2A1C] text-[#22C55E] border border-[rgba(34,197,94,0.3)] text-[12px] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span>System operational — Guardrails active</span>
              </span>
            )}
          </div>
        </div>

        {/* Description paragraph: 14px --text-secondary (#94A3B8), line-height 1.6, max-width 640px, margin-bottom 20px */}
        <p className="text-[14px] text-[#94A3B8] leading-[1.6] max-w-[640px] mb-5">
          Immediately halts all automated recovery actions, pauses payment link generation via Razorpay,
          and stops the batch pipeline. Ingested failures will safely be parked with status{" "}
          <code className="text-[#DC2626] text-[12px] bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.25)] px-1.5 py-0.5 rounded-[4px] font-mono">
            HALTED
          </code>.
        </p>

        {/* Action Button: background --danger-primary (#DC2626), min-width 220px, padding 12px 24px, rounded 8px, font-weight 600, 14px, white-space nowrap */}
        <div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className={`px-6 py-3 min-w-[220px] rounded-[8px] text-[14px] font-semibold text-white transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap ${
              active
                ? "bg-[#22C55E] hover:bg-[#16A34A] shadow-md shadow-[#22C55E]/20"
                : "bg-[#DC2626] hover:bg-[#B91C1C] shadow-md shadow-[#DC2626]/25"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            <span>
              {active ? "Deactivate Kill Switch" : "Activate Kill Switch"}
            </span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121826] border border-[#2E3A52] rounded-[12px] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-[8px] flex items-center justify-center border ${
                  active
                    ? "bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.3)]"
                    : "bg-[rgba(220,38,38,0.1)] border-[rgba(220,38,38,0.3)]"
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${active ? "text-[#22C55E]" : "text-[#DC2626]"}`}
                />
              </div>
              <h4 className="text-[16px] font-semibold text-[#F4F6FA] leading-tight">
                {active
                  ? "Resume Autonomous Operations?"
                  : "Activate Emergency Kill Switch?"}
              </h4>
            </div>

            <p className="text-[13px] text-[#94A3B8] leading-relaxed">
              {active
                ? "This will resume the policy engine and allow recovery link creation in Razorpay Test Mode."
                : "This immediately stops all Revyn automated recovery actions. No links will be generated until deactivated."}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 min-w-[120px] rounded-[8px] bg-[#1A2233] hover:bg-[#202B40] text-[13px] font-medium text-[#94A3B8] transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleKillSwitch(!active)}
                className={`flex-1 py-2.5 px-4 min-w-[120px] rounded-[8px] text-[13px] font-semibold text-white transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#22C55E] hover:bg-[#16A34A]"
                    : "bg-[#DC2626] hover:bg-[#B91C1C]"
                }`}
              >
                {active ? "Yes, Resume" : "Yes, Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
