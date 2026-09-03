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
        className={`p-6 rounded-2xl border transition-all duration-300 ${
          active
            ? "bg-rose-950/30 border-rose-500/40 shadow-lg shadow-rose-950/30"
            : "bg-[#111827] border-[#374151]/60"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Info Block */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                active
                  ? "bg-rose-500/15 border-rose-500/30"
                  : "bg-[#1F2937] border-[#374151]/60"
              }`}
            >
              {active ? (
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                Emergency Kill Switch
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                Immediately halts all automated recovery operations, stops Razorpay payment link creation,
                and pauses all batch processing. Incoming failed payments are safely parked with status{" "}
                <code className="text-rose-400 text-[11px] bg-rose-500/10 px-1 py-0.5 rounded">HALTED</code>.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    active
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      : "bg-emerald-500/8 text-emerald-400 border-emerald-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? "bg-rose-400 animate-pulse" : "bg-emerald-400"
                    }`}
                  />
                  {active ? "KILL SWITCH ACTIVE — All ops halted" : "System operational — All guardrails active"}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shrink-0 ${
              active
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 hover:shadow-emerald-800/40"
                : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30 hover:shadow-rose-800/40"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#374151] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                  active
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-rose-500/10 border-rose-500/20"
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${active ? "text-emerald-400" : "text-rose-400"}`}
                />
              </div>
              <h4 className="text-base font-bold text-white leading-tight">
                {active
                  ? "Resume Recovery Operations?"
                  : "Activate Emergency Kill Switch?"}
              </h4>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              {active
                ? "This will re-enable the Policy Engine and allow Revyn to process failed payments and create Razorpay Test Mode payment links."
                : "This will immediately halt all automated Revyn recovery actions. No payments will be retried and no Razorpay links will be created until deactivated."}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-sm font-semibold text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleKillSwitch(!active)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
                  active
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {active ? "Yes, Resume Operations" : "Yes, Activate Kill Switch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
