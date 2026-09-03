"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
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
      <div
        className={`p-6 rounded-[12px] border transition-all ${
          active
            ? "bg-[rgba(239,68,68,0.1)] border-[#EF4444]/40"
            : "bg-[#121826] border-[rgba(38,48,69,0.4)]"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Info Block */}
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-[8px] border flex items-center justify-center shrink-0 ${
                active
                  ? "bg-[rgba(239,68,68,0.2)] border-[#EF4444]/50"
                  : "bg-[#1A2233] border-[#2E3A52]"
              }`}
            >
              {active ? (
                <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
              )}
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#F4F6FA] leading-tight">
                Emergency Kill Switch
              </h3>
              <p className="text-[13px] text-[#94A3B8] leading-[1.5] max-w-xl mt-1">
                Immediately halts all autonomous recovery actions, disables Razorpay payment link generation,
                and pauses all batch execution. Failed payments are safely held in status{" "}
                <code className="text-[#EF4444] text-[11px] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] px-1.5 py-0.5 rounded">HALTED</code>.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full border ${
                    active
                      ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]"
                      : "bg-[#0F2A1C] text-[#22C55E] border-[rgba(34,197,94,0.3)]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? "bg-[#EF4444] animate-pulse" : "bg-[#22C55E]"
                    }`}
                  />
                  {active ? "KILL SWITCH ACTIVE — All ops halted" : "System operational — Guardrails active"}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className={`px-5 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all shrink-0 flex items-center gap-2 ${
              active
                ? "bg-[#22C55E] hover:bg-[#22C55E]/90 text-white shadow-md shadow-[#22C55E]/20"
                : "bg-[#EF4444] hover:bg-[#EF4444]/90 text-white shadow-md shadow-[#EF4444]/20"
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
                    : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)]"
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${active ? "text-[#22C55E]" : "text-[#EF4444]"}`}
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
                className="flex-1 py-2 px-4 rounded-[8px] bg-[#1A2233] hover:bg-[#202B40] text-[13px] font-medium text-[#94A3B8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleKillSwitch(!active)}
                className={`flex-1 py-2 px-4 rounded-[8px] text-[13px] font-semibold text-white transition-colors ${
                  active
                    ? "bg-[#22C55E] hover:bg-[#22C55E]/90"
                    : "bg-[#EF4444] hover:bg-[#EF4444]/90"
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
