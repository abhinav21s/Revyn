"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MetricsCards } from "@/components/metrics-cards";
import { DashboardCharts } from "@/components/dashboard-charts";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import { Panel } from "@/components/primitives";
import { MOCK_CASES, MOCK_METRICS } from "@/lib/mock-data";
import type { PaymentCase, BatchMetrics } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<BatchMetrics | null>(MOCK_METRICS);
  const [cases, setCases] = useState<PaymentCase[]>(MOCK_CASES);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<PaymentCase | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/cases?limit=25"),
      ]);
      if (mRes.ok) {
        const m = await mRes.json();
        if (m && m.total_cases > 0) setMetrics(m);
      }
      if (cRes.ok) {
        const d = await cRes.json();
        if (d.cases && d.cases.length > 0) setCases(d.cases);
      }
    } catch (e) {
      console.error("Failed to load live dashboard telemetry:", e);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to global batch completions from the TopBar Run Batch button
    const handleBatch = () => loadData();
    window.addEventListener("revyn:batch-completed", handleBatch);
    return () => window.removeEventListener("revyn:batch-completed", handleBatch);
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* ── 1. 4 Metric Cards in responsive grid (Total at Risk, Recovered, Rate, Pending) ── */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* ── 2. Analytical Panels: Recovery Rate vs Naïve Retry + Root Cause Distribution ── */}
      <DashboardCharts cases={cases} metrics={metrics} />

      {/* ── 3. Recent recoveries panel & table ── */}
      <Panel
        title="Recent recoveries"
        description="Live telemetry of payment failure recoveries"
        action={
          <Link
            href="/recoveries"
            className="text-[12px] font-medium flex items-center gap-1 hover:underline transition-all"
            style={{ color: "var(--primary)" }}
          >
            <span>Open workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <RecoveryTable
          cases={cases}
          loading={loading}
          onSelectCase={setSelectedCase}
          onRefresh={loadData}
          onRunBatch={loadData}
          compact={true}
        />
      </Panel>

      {/* ── 4. Case Detail Drawer ── */}
      <CaseDetail
        paymentCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onCaseUpdated={loadData}
      />
    </div>
  );
}
