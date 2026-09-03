"use client";

import React, { useState, useEffect } from "react";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import type { PaymentCase } from "@/lib/types";
import { RefreshCw } from "lucide-react";

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

  const recovered = cases.filter((c) => c.status === "recovered").length;
  const inProgress = cases.filter((c) => c.status === "in_progress").length;
  const escalated = cases.filter((c) => c.status === "escalated").length;
  const unrecoverable = cases.filter((c) => c.status === "unrecoverable").length;

  return (
    <div className="space-y-6">
      {/* Title Block */}
      <div>
        <h1 className="text-[28px] font-bold text-[#F4F6FA] tracking-[-0.02em] leading-tight">
          Recovery Workspace
        </h1>
        <p className="text-[14px] text-[#94A3B8] leading-[1.5] mt-1">
          Inspect, filter, and simulate resolution for all ingested payment failure cases.
        </p>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Cases",
            value: cases.length,
            color: "text-[#4F7CFF]",
            bg: "bg-[#121826] border-[rgba(38,48,69,0.4)]",
          },
          {
            label: "Recovered",
            value: recovered,
            color: "text-[#22C55E]",
            bg: "bg-[#121826] border-[rgba(38,48,69,0.4)]",
          },
          {
            label: "Escalated",
            value: escalated,
            color: "text-[#EF4444]",
            bg: "bg-[#121826] border-[rgba(38,48,69,0.4)]",
          },
          {
            label: "Unrecoverable",
            value: unrecoverable,
            color: "text-[#94A3B8]",
            bg: "bg-[#121826] border-[rgba(38,48,69,0.4)]",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-[12px] border ${stat.bg} flex flex-col justify-between shadow-sm`}
          >
            <div className="text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">
              {stat.label}
            </div>
            <div className={`text-[24px] font-bold tabular-nums ${stat.color} mt-2`}>
              {loading ? "—" : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Cases Table Block */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[18px] font-semibold text-[#F4F6FA] tracking-tight">
            All Payment Cases ({cases.length})
          </h2>
          <button
            onClick={loadCases}
            disabled={loading}
            className="px-3 py-1.5 rounded-[8px] bg-[#1A2233] hover:bg-[#202B40] text-[#94A3B8] hover:text-[#F4F6FA] text-[13px] font-medium transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#4F7CFF]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <RecoveryTable
          cases={cases}
          loading={loading}
          onSelectCase={setSelectedCase}
          onRefresh={loadCases}
          onRunBatch={loadCases}
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
