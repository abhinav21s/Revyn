"use client";

import React, { useState } from "react";
import {
  Play,
  RefreshCw,
  Trash2,
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
      showStatus("Cannot run batch: Emergency Kill Switch is ACTIVE. Deactivate in Settings first.", "error");
      return;
    }

    setLoading(true);
    setStatusType("loading");
    setStatusMessage(`Processing ${batchSize} payment failures through the bounded recovery pipeline…`);

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
      {/* ── Execute Recovery Pipeline Card (padding: 24px, border-radius: 12px, bg: #121826, border: 1px solid rgba(38,48,69,0.3)) ── */}
      <div className="p-6 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.3)] shadow-sm">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[16px] font-semibold text-[#F4F6FA] leading-none">
            Execute Recovery Pipeline
          </h2>
          <button
            onClick={() => setResetConfirmOpen(true)}
            disabled={resetting || loading}
            title="Clear all demo cases"
            className="p-1.5 rounded-[6px] hover:bg-[#1A2233] text-[#5B6B85] hover:text-[#EF4444] transition-colors disabled:opacity-40"
          >
            {resetting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Description: 14px --text-secondary (#94A3B8), line-height 1.5, max-width 640px, margin-bottom 20px */}
        <p className="text-[14px] text-[#94A3B8] leading-[1.5] max-w-[640px] mb-5">
          Ingest synthetic payment failures, classify root cause via deterministic rules or Groq AI, then apply policy guardrails and create Razorpay Test Mode recovery links.
        </p>

        {/* Batch-size pills & Run Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Segmented button track: track background --bg-canvas (#0B0F19), border-radius 10px, padding 4px */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#5B6B85] font-medium mr-1 whitespace-nowrap">
              Batch size:
            </span>
            <div className="inline-flex items-center bg-[#0B0F19] border border-[#2E3A52] rounded-[10px] p-1">
              {[5, 10, 20, 50].map((size) => {
                const isSelected = batchSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBatchSize(size)}
                    disabled={loading}
                    className={`py-2 px-4 min-w-[96px] text-center text-[13px] rounded-[7px] transition-all whitespace-nowrap ${
                      isSelected
                        ? "bg-[#4F7CFF] text-white font-semibold shadow-sm"
                        : "text-[#94A3B8] hover:text-[#F4F6FA] hover:bg-[#1A2233]"
                    }`}
                  >
                    {size} cases
                  </button>
                );
              })}
            </div>
          </div>

          {/* "Run Batch Recovery" button: padding 12px 28px, min-width: 200px, border-radius 8px, background --accent-primary, font-size 14px/600, white-space: nowrap */}
          <button
            onClick={handleRunBatch}
            disabled={loading || killSwitchActive}
            className={`w-full sm:w-auto px-7 py-3 min-w-[200px] rounded-[8px] text-[14px] font-semibold text-white transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              killSwitchActive
                ? "bg-[#2E3A52] text-[#94A3B8] cursor-not-allowed"
                : loading
                ? "bg-[#4F7CFF]/70 cursor-wait"
                : "bg-[#4F7CFF] hover:bg-[#6B91FF] active:scale-[0.99] shadow-md shadow-[#4F7CFF]/20"
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
        </div>

        {/* Status Notification */}
        {statusMessage && statusType !== "idle" && (
          <div
            className={`mt-4 p-3.5 rounded-[8px] flex items-start gap-2.5 text-[13px] border ${
              statusType === "error"
                ? "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-[#EF4444]"
                : statusType === "success"
                ? "bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.3)] text-[#22C55E]"
                : "bg-[rgba(79,124,255,0.1)] border-[rgba(79,124,255,0.3)] text-[#4F7CFF]"
            }`}
          >
            {statusType === "error" ? (
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            ) : statusType === "loading" ? (
              <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-normal">{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#121826] border border-[#2E3A52] rounded-[12px] p-6 space-y-4 shadow-2xl">
            <h4 className="text-[16px] font-semibold text-[#F4F6FA]">Clear All Demo Cases?</h4>
            <p className="text-[13px] text-[#94A3B8] leading-relaxed">
              This will reset the demo data and clear all cases and audit logs.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 min-w-[120px] rounded-[8px] bg-[#1A2233] hover:bg-[#202B40] text-[13px] font-medium text-[#94A3B8] transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 py-2.5 px-4 min-w-[120px] rounded-[8px] bg-[#DC2626] hover:bg-[#B91C1C] text-[13px] font-semibold text-white transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
