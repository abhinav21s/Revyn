"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MetricsCards } from "@/components/metrics-cards";
import { BatchRunner } from "@/components/batch-runner";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import type { PaymentCase, BatchMetrics } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<BatchMetrics | null>(null);
  const [cases, setCases] = useState<PaymentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<PaymentCase | null>(null);
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, cRes, sRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/cases?limit=20"),
        fetch("/api/settings"),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (cRes.ok) {
        const d = await cRes.json();
        setCases(d.cases || []);
      }
      if (sRes.ok) {
        const d = await sRes.json();
        setKillSwitchActive(d.settings?.kill_switch === "true");
      }
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
    <div className="space-y-6">
      {/* ── Section 6 Typography: H1 (28px, font-weight 700, letter-spacing -0.02em) ── */}
      <div>
        <h1 className="text-[28px] font-bold text-[#F4F6FA] tracking-[-0.02em] leading-tight">
          Revenue Recovery Overview
        </h1>
        <p className="text-[14px] text-[#94A3B8] leading-[1.5] mt-1">
          Bounded AI payment recovery agent for Indian merchants using Razorpay.
        </p>
      </div>

      {/* Metric Cards (Revenue at Risk, Recovered, Rate, Safety Stops) */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* Execute Recovery Pipeline Card (Section 3) */}
      <BatchRunner
        onBatchCompleted={loadData}
        killSwitchActive={killSwitchActive}
      />

      {/* Recent Payment Cases Block */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[18px] font-semibold text-[#F4F6FA] tracking-tight">
            Recent Payment Cases
          </h2>
          <Link
            href="/recoveries"
            className="text-[13px] text-[#4F7CFF] hover:text-[#6B91FF] font-medium flex items-center gap-1 transition-colors"
          >
            <span>View all cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Search Bar / Filter Tabs + Table (Section 4 & 5) */}
        <RecoveryTable
          cases={cases}
          loading={loading}
          onSelectCase={setSelectedCase}
          onRefresh={loadData}
          onRunBatch={loadData}
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
