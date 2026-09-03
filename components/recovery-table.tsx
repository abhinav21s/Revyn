"use client";

import React, { useState } from "react";
import type { PaymentCase } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, RootCauseBadge, ActionBadge } from "./status-badge";
import {
  Search,
  RefreshCw,
  ChevronRight,
  Layers,
  Play,
} from "lucide-react";

interface RecoveryTableProps {
  cases: PaymentCase[];
  loading?: boolean;
  onSelectCase: (paymentCase: PaymentCase) => void;
  onRefresh?: () => void;
  onRunBatch?: () => void;
}

// Skeleton loader row (54px height)
function SkeletonRow() {
  return (
    <tr className="border-b border-[#374151]/40 h-[54px]">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="py-2.5 px-5">
          <div
            className={`h-3 rounded-full bg-[#374151]/60 animate-pulse ${
              i === 1 ? "w-32" : i === 2 ? "w-20" : i === 3 ? "w-24" : "w-16"
            }`}
          />
        </td>
      ))}
    </tr>
  );
}

export function RecoveryTable({
  cases,
  loading = false,
  onSelectCase,
  onRefresh,
  onRunBatch,
}: RecoveryTableProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filteredCases = cases.filter((c) => {
    const matchesFilter = filter === "all" || c.status === filter;
    const matchesSearch =
      search === "" ||
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.error_code.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterTabs = [
    { label: "All", value: "all", count: cases.length },
    { label: "Recovered", value: "recovered", count: cases.filter((c) => c.status === "recovered").length },
    { label: "In Progress", value: "in_progress", count: cases.filter((c) => c.status === "in_progress").length },
    { label: "Escalated", value: "escalated", count: cases.filter((c) => c.status === "escalated").length },
    { label: "Unrecoverable", value: "unrecoverable", count: cases.filter((c) => c.status === "unrecoverable").length },
  ];

  return (
    <div className="rounded-2xl bg-[#111827] border border-[#374151]/60 shadow-sm overflow-hidden">
      {/* ── Table Controls ─────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-[#374151]/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Filter Tabs (exact 28px height, 8px horizontal gap) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 w-full sm:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`h-[28px] flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                filter === tab.value
                  ? "bg-blue-600 text-white border border-blue-500 shadow-sm"
                  : "bg-[#1F2937]/70 text-zinc-400 hover:text-zinc-200 hover:bg-[#1F2937] border border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono min-w-[16px] text-center leading-tight ${
                  filter === tab.value
                    ? "bg-blue-700/80 text-white"
                    : "bg-[#0B0F19] text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customer, error, ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[36px] w-full bg-[#0B0F19] border border-[#374151]/80 rounded-lg pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="h-[36px] px-2.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-zinc-400 hover:text-zinc-200 border border-[#374151]/60 transition-all duration-150 flex items-center justify-center shrink-0"
              title="Refresh cases"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table (horizontal scroll with 8px padding bottom for scrollbar) ── */}
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#374151]/60 bg-[#1F2937]">
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">
                Case / Customer
              </th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">
                Amount
              </th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">
                Root Cause
              </th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">
                Policy Action
              </th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">
                Status
              </th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">
                Ingested
              </th>
              <th className="py-3 px-5 text-right text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 px-5">
                  {/* ── Rich Empty State ────────────────────────── */}
                  <div className="flex flex-col items-center justify-center gap-4 text-center max-w-xs mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-[#1F2937] border border-[#374151]/60 flex items-center justify-center">
                      <Layers className="w-7 h-7 text-zinc-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-200">
                        {search || filter !== "all"
                          ? "No cases match your filter"
                          : "No recovery cases yet"}
                      </p>
                      <p className="text-xs text-zinc-400 opacity-75 leading-relaxed">
                        {search || filter !== "all"
                          ? "Try clearing the search or switching the status filter."
                          : "Run a batch to start recovering failed payments and see all cases here."}
                      </p>
                    </div>
                    {!search && filter === "all" && onRunBatch && (
                      <button
                        onClick={onRunBatch}
                        className="h-[36px] flex items-center gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-900/30 hover:-translate-y-px active:translate-y-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Run Batch Recovery
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="h-[54px] border-b border-[#374151]/30 hover:bg-[#1F2937]/40 cursor-pointer transition-colors duration-[120ms] ease-in-out group"
                >
                  <td className="py-2.5 px-5">
                    <div className="font-semibold text-white text-sm leading-tight">{c.customer_name}</div>
                    <div className="text-[11px] text-zinc-500 font-mono leading-none mt-0.5">
                      #{c.id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="py-2.5 px-5 font-bold text-zinc-200 text-sm tabular-nums">
                    {formatCurrency(c.amount)}
                  </td>
                  <td className="py-2.5 px-5">
                    <RootCauseBadge cause={c.root_cause} method={c.diagnosis_method} />
                  </td>
                  <td className="py-2.5 px-5">
                    <ActionBadge action={c.policy_action} />
                  </td>
                  <td className="py-2.5 px-5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-2.5 px-5 text-[11px] text-zinc-400 whitespace-nowrap">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="py-2.5 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c);
                      }}
                      className="h-[28px] px-2.5 rounded-md inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent hover:border-[#374151] transition-all duration-[120ms]"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
