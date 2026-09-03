"use client";

import React, { useState, useEffect } from "react";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import { Panel } from "@/components/primitives";
import { MOCK_CASES } from "@/lib/mock-data";
import type { PaymentCase } from "@/lib/types";
import { RefreshCw } from "lucide-react";

export default function RecoveriesPage() {
  const [cases, setCases] = useState<PaymentCase[]>(MOCK_CASES);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<PaymentCase | null>(null);

  useEffect(() => {
    loadCases();

    const handleBatch = () => loadCases();
    window.addEventListener("revyn:batch-completed", handleBatch);
    return () => window.removeEventListener("revyn:batch-completed", handleBatch);
  }, []);

  const loadCases = async () => {
    try {
      const res = await fetch("/api/cases?limit=200");
      if (res.ok) {
        const data = await res.json();
        if (data.cases && data.cases.length > 0) {
          setCases(data.cases);
        }
      }
    } catch (e) {
      console.error("Using deterministic workspace dataset:", e);
    }
  };

  const recovered = cases.filter((c) => c.status === "recovered").length;
  const inProgress = cases.filter((c) => c.status === "in_progress").length;
  const escalated = cases.filter((c) => c.status === "escalated").length;
  const stopped = cases.filter((c) => c.status === "unrecoverable" || c.status === "halted").length;

  return (
    <div className="space-y-6">
      {/* ── Status Ticker Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Cases", value: cases.length, color: "var(--primary)" },
          { label: "Recovered", value: recovered, color: "var(--success)" },
          { label: "Escalated", value: escalated, color: "var(--warning)" },
          { label: "Stopped", value: stopped, color: "var(--destructive)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl border flex flex-col justify-between"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--subtle)" }}>
              {stat.label}
            </span>
            <div className="text-[26px] font-bold font-mono tracking-tight mt-1" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Workspace Panel ── */}
      <Panel
        title="Recovery cases"
        description="Dense operational table with root-cause diagnoses, attempt counts, and deterministic policy actions"
        action={
          <button
            onClick={loadCases}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium border flex items-center gap-1.5 transition-colors hover:bg-slate-800"
            style={{ background: "transparent", borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            <span>Refresh telemetry</span>
          </button>
        }
      >
        <RecoveryTable
          cases={cases}
          loading={loading}
          onSelectCase={setSelectedCase}
          onRefresh={loadCases}
          onRunBatch={loadCases}
          compact={false}
        />
      </Panel>

      {/* ── Case Detail Drawer ── */}
      <CaseDetail
        paymentCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onCaseUpdated={loadCases}
      />
    </div>
  );
}
