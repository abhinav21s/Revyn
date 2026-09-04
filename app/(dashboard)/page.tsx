"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MetricsCards } from "@/components/metrics-cards";
import { DashboardCharts } from "@/components/dashboard-charts";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import { Panel } from "@/components/primitives";
import { MOCK_CASES, MOCK_METRICS } from "@/lib/mock-data";
import type { PaymentCase, BatchMetrics } from "@/lib/types";
import { ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<BatchMetrics | null>(MOCK_METRICS);
  const [cases, setCases] = useState<PaymentCase[]>(MOCK_CASES);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<PaymentCase | null>(null);
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [mRes, cRes, sRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/cases?limit=25"),
        fetch("/api/settings"),
      ]);
      if (mRes.ok) {
        const m = await mRes.json();
        if (m && m.total_cases > 0) setMetrics(m);
      }
      if (cRes.ok) {
        const d = await cRes.json();
        if (d.cases && d.cases.length > 0) setCases(d.cases);
      }
      if (sRes.ok) {
        const s = await sRes.json();
        setKillSwitchActive(s.settings?.kill_switch === "true");
      }
    } catch (e) {
      console.error("Failed to load live dashboard telemetry:", e);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to global batch completions and kill switch changes from the TopBar
    const handleBatch = () => loadData();
    window.addEventListener("revyn:batch-completed", handleBatch);
    window.addEventListener("revyn:kill-switch-changed", handleBatch);
    return () => {
      window.removeEventListener("revyn:batch-completed", handleBatch);
      window.removeEventListener("revyn:kill-switch-changed", handleBatch);
    };
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* ── Kill Switch Alert Banner ── */}
      {killSwitchActive && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-red-500/40 bg-red-950/20 shadow-[0_0_24px_rgba(239,68,68,0.15)]">
          <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-red-400">
              Emergency Kill Switch is ACTIVE — All autonomous recovery actions are halted.
            </p>
            <p className="text-[12px] text-red-400/70 mt-0.5">
              New failures are being parked with status <code className="font-mono font-bold">HALTED</code>. Disable the kill switch in Settings to resume operations.
            </p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-[12px] font-bold border border-red-500/30 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
          >
            Go to Settings
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── 1. 4 Metric Cards in responsive grid (Total at Risk, Recovered, Rate, Pending) ── */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* ── 2. Analytical Panels: Recovery Rate vs Naïve Retry + Root Cause Distribution ── */}
      <DashboardCharts cases={cases} metrics={metrics} />

      {/* ── 3. Recent recoveries split layout: Left Table + Right Details (Active at all screen sizes) ── */}
      <div className="flex flex-row items-start gap-4 lg:gap-6 w-full min-w-0">
        <div className={`min-w-0 overflow-hidden transition-all duration-200 ${selectedCase ? "w-[56%] lg:w-[60%]" : "w-full"}`}>
          <Panel
            title="Recent recoveries"
            description="Live telemetry of payment failure recoveries"
            action={
              <Link
                href="/recoveries"
                className="text-[12px] font-semibold text-[#0084FF] hover:underline flex items-center gap-1 transition-all"
              >
                <span>Open workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <RecoveryTable
              cases={cases}
              loading={loading}
              selectedCaseId={selectedCase?.id}
              onSelectCase={setSelectedCase}
              onRefresh={loadData}
              onRunBatch={loadData}
              compact={true}
            />
          </Panel>
        </div>

        {/* Right Side: Detailed info on transaction click (Proportional width stays on screen) */}
        {selectedCase && (
          <div className="w-[44%] lg:w-[40%] min-w-0 shrink-0 sticky top-20">
            <CaseDetail
              paymentCase={selectedCase}
              onClose={() => setSelectedCase(null)}
              onCaseUpdated={loadData}
              inline={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
