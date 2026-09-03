"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/top-bar";
import { MetricsCards } from "@/components/metrics-cards";
import { BatchRunner } from "@/components/batch-runner";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import type { PaymentCase, BatchMetrics } from "@/lib/types";
import { Layers, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<BatchMetrics | null>(null);
  const [cases, setCases] = useState<PaymentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<PaymentCase | null>(null);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [runBatchTrigger, setRunBatchTrigger] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, cRes, sRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/cases?limit=20"),
        fetch("/api/settings"),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (cRes.ok) { const d = await cRes.json(); setCases(d.cases || []); }
      if (sRes.ok) { const d = await sRes.json(); setKillSwitchActive(d.settings?.kill_switch === "true"); }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 md:space-y-8">
      <TopBar
        title="Revenue Recovery Overview"
        subtitle="Bounded AI agent for recovering failed payments across Indian merchants"
      />

      {/* Metrics */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* Batch Runner */}
      <BatchRunner
        onBatchCompleted={loadData}
        killSwitchActive={killSwitchActive}
      />

      {/* Recent Cases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-[15px] font-bold text-white tracking-tight">
              Recent Payment Cases
            </h2>
            {!loading && (
              <span className="text-xs text-zinc-500 font-mono">({cases.length})</span>
            )}
          </div>
          <Link
            href="/recoveries"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
          >
            View all cases
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <RecoveryTable
          cases={cases}
          loading={loading}
          onSelectCase={setSelectedCase}
          onRefresh={loadData}
          onRunBatch={() => setRunBatchTrigger((n) => n + 1)}
        />
      </div>

      {/* Case Detail Drawer */}
      <CaseDetail
        paymentCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onCaseUpdated={loadData}
      />
    </div>
  );
}
