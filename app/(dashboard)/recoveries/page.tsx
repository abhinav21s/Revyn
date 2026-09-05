"use client";

import React, { useState, useEffect } from "react";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import { Panel } from "@/components/primitives";

import type { PaymentCase } from "@/lib/types";
import { RefreshCw } from "lucide-react";

// In-memory cases cache across tab navigation so recoveries table displays instantly with zero flicker
let cachedCases: PaymentCase[] = [];

export default function RecoveriesPage() {
  const [cases, setCases] = useState<PaymentCase[]>(() => cachedCases);
  const [loading, setLoading] = useState<boolean>(() => cachedCases.length === 0);
  const [selectedCase, setSelectedCase] = useState<PaymentCase | null>(null);

  useEffect(() => {
    loadCases();

    const handleBatch = () => loadCases();
    const handleFocus = () => loadCases();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadCases();
      }
    };

    window.addEventListener("revyn:batch-completed", handleBatch);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("revyn:batch-completed", handleBatch);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const loadCases = async () => {
    try {
      const res = await fetch("/api/cases?limit=200");
      if (res.ok) {
        const data = await res.json();
        if (data.cases && data.cases.length > 0) {
          cachedCases = data.cases;
          setCases(data.cases);
          setSelectedCase((prev) => {
            if (!prev) return null;
            return data.cases.find((c: PaymentCase) => c.id === prev.id) || prev;
          });
        }
      }
    } catch (e) {
      console.error("Using deterministic workspace dataset:", e);
    } finally {
      setLoading(false);
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
          { label: "Total Cases", value: cases.length, color: "text-[#0084FF]" },
          { label: "Recovered", value: recovered, color: "text-emerald-400" },
          { label: "Escalated", value: escalated, color: "text-amber-400" },
          { label: "Stopped", value: stopped, color: "text-red-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl border border-[#1C273E] bg-[#0F1523] shadow-lg shadow-black/40 flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              {stat.label}
            </span>
            <div className={`text-[30px] font-black font-mono tracking-tight mt-1 leading-none ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Split Layout Container: Left Table + Right Detail (Active at all screen sizes) ── */}
      <div className="flex flex-row items-start gap-4 lg:gap-6 w-full min-w-0">
        {/* Left Side: Recovery Cases Table */}
        <div className={`min-w-0 overflow-hidden transition-all duration-200 ${selectedCase ? "w-[56%] lg:w-[60%]" : "w-full"}`}>
          <Panel
            title="Recovery cases"
            description="Dense operational table with root-cause diagnoses, attempt counts, and deterministic policy actions"
            action={
              <button
                onClick={loadCases}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border border-[#1C273E] bg-[#090D17] hover:bg-[#141C2E] flex items-center gap-1.5 transition-colors text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0084FF]" : ""}`} />
                <span>Refresh telemetry</span>
              </button>
            }
          >
            <RecoveryTable
              cases={cases}
              loading={loading}
              selectedCaseId={selectedCase?.id}
              onSelectCase={(c) => setSelectedCase(c)}
              onRefresh={loadCases}
              onRunBatch={loadCases}
              compact={!!selectedCase}
            />
          </Panel>
        </div>

        {/* Right Side: Detailed Section Split (Proportional width guaranteed to stay on screen) */}
        {selectedCase && (
          <div className="w-[44%] lg:w-[40%] min-w-0 shrink-0 sticky top-20">
            <CaseDetail
              paymentCase={selectedCase}
              onClose={() => setSelectedCase(null)}
              onCaseUpdated={loadCases}
              inline={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
