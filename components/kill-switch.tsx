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
    <div
      className={`p-6 rounded-xl border transition-all ${
        active
          ? "bg-rose-500/10 border-rose-500/40 shadow-xl shadow-rose-950/30"
          : "bg-[#111827] border-[#1F2937]"
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {active ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="text-base font-bold text-white tracking-tight">
              Emergency Kill Switch & Global Halt
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
            Immediately halts all automated recovery operations, stops Razorpay payment link creations, and pauses batch runners. When activated, all incoming failed payments are safely parked with status <span className="font-mono text-rose-400">HALTED</span>.
          </p>
        </div>

        <div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
              active
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
            }`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            <span>{active ? "Deactivate Kill Switch (Resume)" : "ACTIVATE KILL SWITCH"}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0E1424] border border-[#1F2937] rounded-xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-white">
                {active
                  ? "Resume Recovery Operations?"
                  : "Confirm Emergency Kill Switch Activation"}
              </h4>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {active
                ? "This will re-enable the Policy Engine and allow Revyn to process failed payments and create Razorpay payment links."
                : "This will immediately halt all Revyn recovery actions. No payments will be retried, and all batch jobs will pause until deactivated."}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleKillSwitch(!active)}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition ${
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
    </div>
  );
}
