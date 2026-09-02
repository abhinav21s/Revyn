"use client";

import React, { useState } from "react";
import {
  Play,
  RefreshCw,
  Trash2,
  Zap,
  CheckCircle2,
  AlertCircle,
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const handleRunBatch = async () => {
    if (killSwitchActive) {
      setStatusMessage("Cannot run batch: Global Kill Switch is ACTIVE.");
      return;
    }

    setLoading(true);
    setStatusMessage("Ingesting failed payments and running Policy Engine...");

    try {
      const res = await fetch("/api/batch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_size: batchSize, use_synthetic: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage(`Batch failed: ${data.error || "Unknown error"}`);
      } else {
        setStatusMessage(
          `Batch completed: ${data.results.processed} payments processed (${data.results.payment_link_sent} Razorpay links created, ${data.results.smart_retry} smart retries, ${data.results.escalated} escalated, ${data.results.skipped_economic_floor + data.results.unrecoverable} safety stops).`
        );
        onBatchCompleted();
      }
    } catch (err) {
      setStatusMessage(`Error running batch: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm("Are you sure you want to reset all demo cases and restart?"))
      return;

    setResetting(true);
    try {
      const res = await fetch("/api/cases", { method: "DELETE" });
      if (res.ok) {
        setStatusMessage("All demo cases cleared. Ready for a new batch.");
        onBatchCompleted();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937] space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Execute Recovery Pipeline
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Ingest synthetic payment failures, classify root cause via rule-engine / Groq AI, and execute deterministic policy guardrails.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Batch Size Selector */}
          <div className="flex items-center gap-2 bg-[#0B0F19] border border-[#1F2937] rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-zinc-400">Batch:</span>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              disabled={loading}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value={10} className="bg-[#111827]">
                10 cases
              </option>
              <option value={20} className="bg-[#111827]">
                20 cases
              </option>
              <option value={50} className="bg-[#111827]">
                50 cases
              </option>
            </select>
          </div>

          {/* Run Batch Button */}
          <button
            onClick={handleRunBatch}
            disabled={loading || killSwitchActive}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-lg ${
              killSwitchActive
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Batch Recovery</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetData}
            disabled={resetting || loading}
            title="Clear all cases"
            className="p-2 rounded-lg bg-[#1F2937] hover:bg-rose-500/20 hover:text-rose-300 text-zinc-400 border border-[#1F2937] transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Status Feedback */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            statusMessage.includes("failed") || statusMessage.includes("Cannot")
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : statusMessage.includes("completed")
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}
        >
          {statusMessage.includes("failed") || statusMessage.includes("Cannot") ? (
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
