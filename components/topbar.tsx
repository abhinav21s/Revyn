"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { TestModeChip } from "./primitives";
import { Play, RefreshCw, Menu, ChevronDown, ShieldAlert } from "lucide-react";
import { emitToast } from "@/lib/toast";

interface TopBarProps {
  onToggleSidebar?: () => void;
  onRunBatchTrigger?: () => void;
}

export function TopBar({ onToggleSidebar, onRunBatchTrigger }: TopBarProps) {
  const pathname = usePathname();
  const [running, setRunning] = useState(false);
  const [batchSize, setBatchSize] = useState(20);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  // Fetch kill switch state on mount and listen for changes
  useEffect(() => {
    const checkKillSwitch = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setKillSwitchActive(data.settings?.kill_switch === "true");
        }
      } catch { /* silent */ }
    };
    checkKillSwitch();

    // Re-check after any batch-completed or kill-switch events
    const handleUpdate = () => checkKillSwitch();
    window.addEventListener("revyn:batch-completed", handleUpdate);
    window.addEventListener("revyn:kill-switch-changed", handleUpdate);
    return () => {
      window.removeEventListener("revyn:batch-completed", handleUpdate);
      window.removeEventListener("revyn:kill-switch-changed", handleUpdate);
    };
  }, []);

  const getPageTitle = () => {
    switch (pathname) {
      case "/recoveries": return "Recovery Workspace";
      case "/audit": return "Immutable Audit Ledger";
      case "/settings": return "Settings & Policy Engine";
      default: return "Operations Console";
    }
  };

  const getSubtitle = () => {
    switch (pathname) {
      case "/recoveries": return "Active & historical recovery cases";
      case "/audit": return "Tamper-evident policy execution records";
      case "/settings": return "Bounded guardrails & API connectivity";
      default: return "Live revenue recovery pipeline";
    }
  };

  const handleRunBatch = async () => {
    if (killSwitchActive) {
      emitToast("Cannot run batch: Emergency Kill Switch is active.", "warning");
      return;
    }
    setRunning(true);
    emitToast(`Processing recovery batch pipeline for ${batchSize} synthetic cases...`, "info", 3000);
    
    try {
      const res = await fetch("/api/batch/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_size: batchSize, use_synthetic: true }),
      });
      if (res.ok) {
        const data = await res.json();
        const summary = data.results
          ? `Batch Complete: ${data.results.processed} cases processed · ${data.results.payment_link_sent} links generated · ${data.results.smart_retry} retries`
          : "Batch completed successfully!";
        emitToast(summary, "success", 5000);
        if (onRunBatchTrigger) onRunBatchTrigger();
        window.dispatchEvent(new CustomEvent("revyn:batch-completed"));
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.kill_switch) {
          emitToast("Kill switch is active — batch execution halted.", "error");
        } else {
          emitToast("Batch execution failed. Please check gateway connection.", "error");
        }
      }
    } catch {
      emitToast("Network error while executing batch.", "error");
    } finally {
      setRunning(false);
    }
  };

  const batchSizes = [10, 20, 50];

  return (
    <header
      className={`sticky top-0 z-40 h-[64px] border-b flex items-center justify-between px-6 backdrop-blur-md transition-all ${
        killSwitchActive ? "border-red-500/40 bg-red-950/10" : ""
      }`}
      style={
        killSwitchActive
          ? { borderColor: "rgba(239,68,68,0.4)", background: "rgba(30,0,0,0.92)" }
          : { background: "rgba(5, 8, 15, 0.88)", borderColor: "var(--border)" }
      }
    >
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          style={{ background: "var(--accent)" }}
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-[20px] font-semibold leading-tight tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              {getPageTitle()}
            </h1>
            {/* Kill switch indicator in topbar */}
            {killSwitchActive && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                KILL SWITCH ACTIVE
              </span>
            )}
          </div>
          <p className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--subtle)" }}>
            {getSubtitle()}
          </p>
        </div>
      </div>

      {/* Right: TEST MODE chip, Batch size Selector + Run Batch, OP chip */}
      <div className="flex items-center gap-3">
        {/* TEST MODE Chip */}
        <TestModeChip />

        {/* Batch Size Selector + Run Batch Controls */}
        <div className="relative flex items-center rounded-xl border border-[#1C273E] bg-[#0F1523] p-0.5 shadow-md">
          {/* Custom / Native Batch Size dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              disabled={running || killSwitchActive}
              className={`h-[34px] px-3 flex items-center gap-1.5 text-[13px] font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                killSwitchActive
                  ? "bg-red-950/30 text-red-400"
                  : "hover:bg-[#18233A] text-[#F8FAFC]"
              }`}
              title="Select batch size"
            >
              <span className="font-mono text-[12px] text-[#64748B]">Batch:</span>
              <span className="font-mono font-bold text-[#0084FF]">{batchSize}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
            </button>

            {/* Dropdown Menu (fixed relative positioning, high z-index, no clipping) */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-36 rounded-xl border border-[#1C273E] bg-[#090D17] p-1.5 shadow-2xl z-[101] animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-[#64748B] font-bold">
                    Select Size
                  </div>
                  {batchSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setBatchSize(size);
                        setDropdownOpen(false);
                        emitToast(`Selected batch size: ${size} cases`, "info", 2000);
                      }}
                      className={`w-full px-3 py-2 text-[12px] font-mono text-left rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                        batchSize === size
                          ? "bg-[#0084FF] text-white font-bold shadow-sm"
                          : "text-[#94A3B8] hover:bg-[#141C2E] hover:text-[#F8FAFC]"
                      }`}
                    >
                      <span>{size} cases</span>
                      {batchSize === size && <span className="text-[10px]">●</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-[1px] h-5 bg-[#1C273E] mx-0.5" />

          {/* Run Batch button */}
          <button
            type="button"
            onClick={handleRunBatch}
            disabled={running || killSwitchActive}
            title={killSwitchActive ? "Kill switch is active — batch execution halted" : `Run batch of ${batchSize} synthetic payments`}
            className={`h-[34px] px-4 text-[13px] font-semibold rounded-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              killSwitchActive
                ? "bg-red-700/40 text-red-300"
                : "bg-[#0084FF] hover:bg-[#0070DB] text-white shadow-[0_0_14px_rgba(0,132,255,0.4)]"
            }`}
          >
            {running ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : killSwitchActive ? (
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span className="whitespace-nowrap">
              {running ? "Processing…" : killSwitchActive ? "Halted" : "Run Batch"}
            </span>
          </button>
        </div>

        {/* OP-01 Status chip */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-mono"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--muted-foreground)",
          }}
        >
          <span className={`w-2 h-2 rounded-full ${killSwitchActive ? "bg-red-400 animate-pulse" : "bg-emerald-400"}`} />
          <span>OP-01</span>
        </div>
      </div>
    </header>
  );
}
