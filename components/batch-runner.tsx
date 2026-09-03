"use client";

import React, { useState } from "react";
import {
  Play,
  RefreshCw,
  Trash2,
  Zap,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

interface BatchRunnerProps {
  onBatchCompleted: () => void;
  killSwitchActive?: boolean;
}

export function BatchRunner({
  onBatchCompleted,
  killSwitchActive = false,
}: BatchRunnerProps) {
  const [loading, setLoading] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(20);
  const [statusType, setStatusType] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const showStatus = (msg: string, type: "success" | "error") => {
    setStatusType(type);
    setStatusMessage(msg);
    if (type === "success") {
      setTimeout(() => {
        setStatusType("idle");
        setStatusMessage(null);
      }, 8000);
    }
  };

  const handleRunBatch = async () => {
    if (killSwitchActive) {
      showStatus("Cannot run batch: Global Kill Switch is ACTIVE. Deactivate it in Settings first.", "error");
      return;
    }

    setLoading(true);
    setStatusType("loading");
    setStatusMessage(`Processing ${batchSize} payment failures through the recovery pipeline…`);

    try {
      const res = await fetch("/api/batch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_size: batchSize, use_synthetic: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        showStatus(`Batch failed: ${data.error || "Unknown error occurred."}`, "error");
      } else {
        const r = data.results;
        showStatus(
          `${r.processed} cases processed  •  ${r.payment_link_sent} Razorpay links created  •  ${r.smart_retry} smart retries  •  ${r.escalated} escalated  •  ${r.skipped_economic_floor + r.unrecoverable} safety stops`,
          "success"
        );
        onBatchCompleted();
      }
    } catch (err) {
      showStatus(`Error: ${String(err)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    setResetting(true);
    setResetConfirmOpen(false);
    try {
      const res = await fetch("/api/cases", { method: "DELETE" });
      if (res.ok) {
        showStatus("All demo cases cleared. Ready for a fresh batch.", "success");
        onBatchCompleted();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <div className="mt-6 py-5 px-6 rounded-2xl bg-[#111827] border border-[#374151]/60 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Title Block (Left icon + title aligned center, 12px gap) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white tracking-tight leading-tight">
                Execute Recovery Pipeline
              </h2>
              <p className="text-xs text-zinc-400 opacity-75 mt-1 max-w-[520px] leading-normal">
                Ingest synthetic payment failures, classify root cause via deterministic rules or Groq AI, then apply policy guardrails and create Razorpay Test Mode recovery links.
              </p>
            </div>
          </div>

          {/* Right side controls (Batch dropdown + Run button + Trash, aligned center) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0">
            {/* Batch Size Dropdown (38px height) */}
            <div className="h-[38px] flex items-center gap-2 bg-[#0B0F19] border border-[#374151]/80 rounded-xl px-3 text-sm">
              <span className="text-xs text-zinc-500 whitespace-nowrap">Batch:</span>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                disabled={loading}
                className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
              >
                <option value={10} className="bg-[#111827]">10 cases</option>
                <option value={20} className="bg-[#111827]">20 cases</option>
                <option value={50} className="bg-[#111827]">50 cases</option>
              </select>
            </div>

            {/* Run Button (height 38px, px-5, gap 12px from dropdown, translateY -1px on hover) */}
            <button
              onClick={handleRunBatch}
              disabled={loading || killSwitchActive}
              className={`h-[38px] flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 rounded-xl text-sm font-bold shadow-lg transition-all duration-150 ease-out hover:-translate-y-px ${
                killSwitchActive
                  ? "bg-[#1F2937] text-zinc-500 cursor-not-allowed border border-[#374151]"
                  : loading
                  ? "bg-blue-700 text-white cursor-wait"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-700/25 hover:shadow-blue-700/40 active:translate-y-0"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running Pipeline…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Batch Recovery</span>
                </>
              )}
            </button>

            {/* Reset Button (gap 8px from Run button) */}
            <button
              onClick={() => setResetConfirmOpen(true)}
              disabled={resetting || loading}
              title="Clear all demo cases"
              className="h-[38px] w-[38px] flex items-center justify-center rounded-xl bg-[#1F2937] hover:bg-rose-500/15 hover:text-rose-400 text-zinc-400 border border-[#374151]/60 transition-all duration-150 ease-out hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0 shrink-0"
            >
              {resetting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {statusMessage && statusType !== "idle" && (
          <div
            className={`p-3.5 rounded-xl flex items-start gap-3 border text-sm transition-all ${
              statusType === "error"
                ? "bg-rose-500/8 border-rose-500/25 text-rose-300"
                : statusType === "success"
                ? "bg-emerald-500/8 border-emerald-500/25 text-emerald-300"
                : "bg-blue-500/8 border-blue-500/25 text-blue-300"
            }`}
          >
            {statusType === "error" ? (
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            ) : statusType === "loading" ? (
              <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 text-blue-400 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            )}
            <span className="leading-relaxed text-xs">{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#111827] border border-[#374151] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <h4 className="text-base font-bold text-white">Clear All Demo Cases?</h4>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              This will permanently delete all current payment cases and audit logs from the demo. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-sm font-semibold text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-bold text-white transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
