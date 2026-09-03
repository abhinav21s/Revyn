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

// Skeleton loader row
function SkeletonRow() {
  return (
    <tr className="border-b border-[#374151]/40">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="py-4 px-5">
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
      <div className="px-5 py-4 border-b border-[#374151]/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 w-full sm:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.value
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-900/50"
                  : "bg-[#1F2937]/60 text-zinc-400 hover:text-zinc-200 hover:bg-[#1F2937]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono min-w-[18px] text-center ${
                  filter === tab.value
                    ? "bg-blue-700/70 text-white"
                    : "bg-[#0B0F19] text-zinc-500"
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
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, error code, ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#374151]/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-zinc-400 hover:text-zinc-200 border border-[#374151]/60 transition-all"
              title="Refresh cases"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#374151]/60 bg-[#0B0F19]/40">
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Case / Customer
              </th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Root Cause
              </th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Policy Action
              </th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Status
              </th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Ingested
              </th>
              <th className="py-3.5 px-5 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
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
                    <div className="w-16 h-16 rounded-2xl bg-[#1F2937] border border-[#374151]/60 flex items-center justify-center">
                      <Layers className="w-8 h-8 text-zinc-600" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-zinc-300">
                        {search || filter !== "all"
                          ? "No cases match your filter"
                          : "No recovery cases yet"}
                      </p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {search || filter !== "all"
                          ? "Try clearing the search or switching the status filter."
                          : "Run a batch to start recovering failed payments and see all cases here."}
                      </p>
                    </div>
                    {!search && filter === "all" && onRunBatch && (
                      <button
                        onClick={onRunBatch}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white transition-all shadow-lg shadow-blue-900/30 hover:scale-[1.02] active:scale-100"
                      >
                        <Play className="w-4 h-4 fill-current" />
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
                  className="border-b border-[#374151]/30 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  <td className="py-4 px-5">
                    <div className="font-semibold text-white text-sm">{c.customer_name}</div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      #{c.id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="py-4 px-5 font-bold text-zinc-200 text-sm tabular-nums">
                    {formatCurrency(c.amount)}
                  </td>
                  <td className="py-4 px-5">
                    <RootCauseBadge cause={c.root_cause} method={c.diagnosis_method} />
                  </td>
                  <td className="py-4 px-5">
                    <ActionBadge action={c.policy_action} />
                  </td>
                  <td className="py-4 px-5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-4 px-5 text-[11px] text-zinc-500 whitespace-nowrap">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] group-hover:bg-blue-600/15 group-hover:text-blue-400 text-zinc-400 text-xs font-semibold border border-[#374151]/60 group-hover:border-blue-500/30 transition-all"
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
