"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import type { PaymentCase } from "@/lib/types";
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";

export default function RecoveriesPage() {
  const [cases, setCases] = useState<PaymentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<PaymentCase | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cases?limit=200");
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Computed summaries
  const recovered = cases.filter((c) => c.status === "recovered").length;
  const inProgress = cases.filter((c) => c.status === "in_progress").length;
  const escalated = cases.filter((c) => c.status === "escalated").length;
  const unrecoverable = cases.filter((c) => c.status === "unrecoverable").length;

  return (
    <div className="space-y-6 md:space-y-8">
      <TopBar
        title="Recovery Workspace"
        subtitle="Inspect, filter and manage all failed payment recovery cases"
      />

      {/* Quick stats row (all four same height 76px, 16px gap, 16px 20px padding) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Cases",
            value: cases.length,
            icon: Layers,
            color: "text-blue-400",
            bg: "bg-blue-500/8 border-blue-500/20",
          },
          {
            label: "Recovered",
            value: recovered,
            icon: CheckCircle2,
            color: "text-emerald-400",
            bg: "bg-emerald-500/8 border-emerald-500/20",
          },
          {
            label: "Escalated",
            value: escalated,
            icon: AlertTriangle,
            color: "text-purple-400",
            bg: "bg-purple-500/8 border-purple-500/20",
          },
          {
            label: "Unrecoverable",
            value: unrecoverable,
            icon: XCircle,
            color: "text-zinc-400",
            bg: "bg-[#1F2937] border-[#374151]/60",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`h-[76px] py-4 px-5 rounded-xl border ${stat.bg} flex items-center gap-3 transition-all duration-150`}
            >
              <Icon className={`w-5 h-5 ${stat.color} shrink-0`} />
              <div>
                <div className={`text-xl font-bold tabular-nums ${stat.color} leading-none`}>
                  {loading ? (
                    <span className="inline-block w-8 h-5 bg-[#374151]/60 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-1 leading-none">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full table with header (margin-top 24px, margin-bottom 12px) */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-[15px] font-bold text-white tracking-tight">
              All Payment Cases
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              ({loading ? "…" : cases.length})
            </span>
          </div>
          <button
            onClick={loadCases}
            disabled={loading}
            className="h-[32px] flex items-center gap-1.5 px-3 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-zinc-400 hover:text-zinc-200 border border-[#374151]/60 text-xs font-semibold transition-all duration-150"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            Refresh
          </button>
        </div>

        <RecoveryTable
          cases={cases}
          loading={loading}
          onSelectCase={setSelectedCase}
          onRefresh={loadCases}
        />
      </div>

      {/* Case Detail Drawer */}
      <CaseDetail
        paymentCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onCaseUpdated={loadCases}
      />
    </div>
  );
}
