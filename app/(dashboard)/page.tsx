"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MetricsCards } from "@/components/metrics-cards";
import { BatchRunner } from "@/components/batch-runner";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import type { PaymentCase, BatchMetrics } from "@/lib/types";
import { ArrowRight, ShieldCheck } from "lucide-react";
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
      {/* ── Title block: H1 (28px / 700 / -0.02em, mb-2) + Subtext & Badges on same row (mb-6) ── */}
      <div>
        <h1 className="text-[28px] font-bold text-[#F4F6FA] tracking-[-0.02em] leading-tight mb-2">
          Revenue Recovery Overview
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <p className="text-[14px] text-[#94A3B8] leading-[1.5]">
            Bounded AI payment recovery agent for Indian merchants using Razorpay.
          </p>

          {/* "TEST MODE" + "Guardrails OK" badges: same row as subtext, right-aligned, gap 12px, pill padding 6px 12px, border-radius 999px */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] text-[12px] font-medium text-[#F59E0B] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <span>TEST MODE</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#0F2A1C] border border-[rgba(34,197,94,0.3)] text-[12px] font-medium text-[#22C55E] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Guardrails OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <MetricsCards metrics={metrics} loading={loading} />

      {/* Execute Recovery Pipeline Card (Section 5) */}
      <BatchRunner
        onBatchCompleted={loadData}
        killSwitchActive={killSwitchActive}
      />

      {/* Recent Payment Cases Card: margin-top 24px, padding 24px, border-radius 12px, background: --bg-surface */}
      <div className="mt-6 p-6 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.3)] shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-semibold text-[#F4F6FA] tracking-tight">
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

        {/* Filter Tabs + Search + Table */}
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
