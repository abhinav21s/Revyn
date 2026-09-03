"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { TestModeChip } from "./primitives";
import { Play, RefreshCw, Menu, CheckCircle2, User } from "lucide-react";

interface TopBarProps {
  onToggleSidebar?: () => void;
  onRunBatchTrigger?: () => void;
}

export function TopBar({ onToggleSidebar, onRunBatchTrigger }: TopBarProps) {
  const pathname = usePathname();
  const [running, setRunning] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);

  const getPageTitle = () => {
    switch (pathname) {
      case "/recoveries":
        return "Recovery Workspace";
      case "/audit":
        return "Immutable Audit Ledger";
      case "/settings":
        return "Settings & Policy Engine";
      default:
        return "Operations Console";
    }
  };

  const getSubtitle = () => {
    switch (pathname) {
      case "/recoveries":
        return "Active & historical recovery cases";
      case "/audit":
        return "Tamper-evident policy execution records";
      case "/settings":
        return "Bounded guardrails & API connectivity";
      default:
        return "Live revenue recovery pipeline";
    }
  };

  const handleRunBatch = async () => {
    setRunning(true);
    setBatchStatus("Running batch...");
    try {
      const res = await fetch("/api/batch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_size: 20, use_synthetic: true }),
      });
      if (res.ok) {
        setBatchStatus("Batch complete");
        setTimeout(() => setBatchStatus(null), 4000);
        if (onRunBatchTrigger) onRunBatchTrigger();
        window.dispatchEvent(new CustomEvent("revyn:batch-completed"));
      } else {
        setBatchStatus("Batch error");
      }
    } catch {
      setBatchStatus("Failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 h-[64px] border-b flex items-center justify-between px-6 backdrop-blur-md"
      style={{
        background: "rgba(5, 8, 15, 0.88)",
        borderColor: "var(--border)",
      }}
    >
      {/* Left: Mobile hamburger + Page Title (20px / 600) & Subtitle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white"
          style={{ background: "var(--accent)" }}
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1
            className="text-[20px] font-semibold leading-tight tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {getPageTitle()}
          </h1>
          <p className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--subtle)" }}>
            {getSubtitle()}
          </p>
        </div>
      </div>

      {/* Right: TEST MODE chip, Run Batch button, status feedback, User chip */}
      <div className="flex items-center gap-3">
        {batchStatus && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-mono" style={{ color: "var(--primary)" }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {batchStatus}
          </span>
        )}

        {/* TEST MODE Chip (amber outlined pill) */}
        <TestModeChip />

        {/* Primary Run Batch Button (electric blue with black text on blue) */}
        <button
          onClick={handleRunBatch}
          disabled={running}
          className="px-4 py-2 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            boxShadow: "0 0 16px rgba(0, 166, 255, 0.3)",
          }}
        >
          {running ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span className="whitespace-nowrap">
            {running ? "Processing…" : "Run Batch"}
          </span>
        </button>

        {/* User Chip / Status indicator per revyn-ui-ux.txt Section 4 */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-mono"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--muted-foreground)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>OP-01</span>
        </div>
      </div>
    </header>
  );
}
