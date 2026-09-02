"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { MetricsCards } from "@/components/metrics-cards";
import { BatchRunner } from "@/components/batch-runner";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import type { PaymentCase, BatchMetrics } from "@/lib/types";
import { Zap, ShieldCheck, ArrowRight, Layers, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<BatchMetrics | null>(null);
  const [cases, setCases] = useState<PaymentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<PaymentCase | null>(null);
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch Metrics
      const mRes = await fetch("/api/metrics");
      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData);
      }

      // Fetch Recent Cases
      const cRes = await fetch("/api/cases?limit=20");
      if (cRes.ok) {
        const cData = await cRes.json();
        setCases(cData.cases || []);
      }

      // Fetch Kill Switch Setting
      const sRes = await fetch("/api/settings");
      if (sRes.ok) {
        const sData = await sRes.json();
        setKillSwitchActive(sData.settings?.kill_switch === "true");
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <TopBar
        title="Revenue Recovery Overview"
        subtitle="AI-Driven Bounded Payment Recovery for Indian Merchants"
      />

      {/* Big Metrics Cards */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* Batch Runner Tool */}
      <BatchRunner
        onBatchCompleted={loadData}
        killSwitchActive={killSwitchActive}
      />

      {/* Recent Recoveries Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Recent Payment Recovery Cases
            </h2>
          </div>
          <Link
            href="/recoveries"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition"
          >
            <span>View All Workspace Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <RecoveryTable
          cases={cases}
          loading={loading}
          onSelectCase={(c) => setSelectedCase(c)}
          onRefresh={loadData}
        />
      </div>

      {/* Case Detail Inspection Drawer */}
      <CaseDetail
        paymentCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onCaseUpdated={loadData}
      />
    </div>
  );
}
