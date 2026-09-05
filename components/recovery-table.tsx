"use client";

import React, { useState } from "react";
import type { PaymentCase } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, RootCauseBadge, ActionTag } from "./status-badge";
import { EmptyState } from "./primitives";
import { Search, ChevronRight, Inbox, Play } from "lucide-react";

interface RecoveryTableProps {
  cases: PaymentCase[];
  loading?: boolean;
  onSelectCase: (paymentCase: PaymentCase) => void;
  onRefresh?: () => void;
  onRunBatch?: () => void;
  compact?: boolean;
  selectedCaseId?: string;
}

export function RecoveryTable({
  cases,
  loading = false,
  onSelectCase,
  onRunBatch,
  compact = false,
  selectedCaseId,
}: RecoveryTableProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const sortedCases = [...cases].sort((a, b) => {
    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  const filteredCases = sortedCases.filter((c) => {
    const statusMatch =
      filter === "all" ||
      c.status === filter ||
      (filter === "stopped" && (c.status === "unrecoverable" || c.status === "halted"));

    const searchLower = search.toLowerCase();
    const searchMatch =
      search === "" ||
      c.id.toLowerCase().includes(searchLower) ||
      c.customer_name.toLowerCase().includes(searchLower) ||
      (c.root_cause && c.root_cause.toLowerCase().includes(searchLower)) ||
      c.error_code.toLowerCase().includes(searchLower);

    return statusMatch && searchMatch;
  });

  const filterTabs = [
    { label: "All", value: "all", count: cases.length },
    { label: "Recovered", value: "recovered", count: cases.filter((c) => c.status === "recovered").length },
    { label: "In progress", value: "in_progress", count: cases.filter((c) => c.status === "in_progress").length },
    { label: "Pending", value: "pending", count: cases.filter((c) => c.status === "pending").length },
    { label: "Escalated", value: "escalated", count: cases.filter((c) => c.status === "escalated").length },
    {
      label: "Stopped",
      value: "stopped",
      count: cases.filter((c) => c.status === "unrecoverable" || c.status === "halted").length,
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* ── Filter Bar: Status Pills + Search Input ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`h-9 px-3.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 border whitespace-nowrap ${
                  isActive
                    ? "bg-[#0084FF]/15 border-[#0084FF] text-[#38BDF8] shadow-sm shadow-[#0084FF]/20 font-semibold"
                    : "bg-[#0F1523] border-[#1C273E] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#141C2E]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? "bg-[#0084FF]/25 text-white" : "bg-[#1C273E] text-[#64748B]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-[320px] shrink-0">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search ID, customer, cause…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg text-[13px] bg-[#0F1523] border border-[#1C273E] text-[#F8FAFC] placeholder-[#64748B] transition-all focus:outline-none focus:border-[#0084FF] focus:ring-1 focus:ring-[#0084FF]"
          />
        </div>
      </div>

      {/* ── Cases Table ── */}
      <div className="rounded-xl border border-[#1C273E] bg-[#0F1523] overflow-hidden shadow-lg shadow-black/30">
        <div className="overflow-x-auto">
          <table className={`w-full text-left border-collapse ${compact ? "min-w-[620px]" : "min-w-[960px]"}`}>
            <thead>
              <tr className="border-b border-[#1C273E] bg-[#090D17] text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className={`py-3.5 px-5 ${compact ? "w-[110px]" : "w-[140px]"}`}>Payment ID</th>
                <th className={`py-3.5 px-5 ${compact ? "w-[160px]" : "w-[220px]"}`}>Customer</th>
                <th className={`py-3.5 px-5 ${compact ? "w-[100px]" : "w-[130px]"}`}>Amount</th>
                <th className={`py-3.5 px-5 ${compact ? "w-[160px]" : "w-[220px]"}`}>Root Cause</th>
                {!compact && <th className="py-3.5 px-5 w-[90px]">Attempts</th>}
                <th className={`py-3.5 px-5 ${compact ? "w-[110px]" : "w-[130px]"}`}>Action</th>
                <th className={`py-3.5 px-5 ${compact ? "w-[100px]" : "w-[120px]"}`}>Status</th>
                <th className={`py-3.5 px-5 ${compact ? "w-[110px]" : "w-[140px]"}`}>Updated</th>
                <th className={`py-3.5 px-5 text-right ${compact ? "w-[40px]" : "w-[60px]"}`}>Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C273E]/50">
              {loading ? (
                <tr>
                  <td colSpan={compact ? 8 : 9} className="py-16 text-center text-[13px] text-[#94A3B8]">
                    Loading telemetry records…
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={compact ? 8 : 9}>
                    <EmptyState
                      icon={Inbox}
                      message={
                        search || filter !== "all"
                          ? "No cases match your filter criteria."
                          : "No recovery cases logged yet — click 'Run Batch' above to ingest failure events."
                      }
                      action={
                        !search && filter === "all" && onRunBatch ? (
                          <button
                            onClick={onRunBatch}
                            className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#0084FF] hover:bg-[#0084FF]/90 text-white flex items-center gap-2 mx-auto shadow-sm shadow-[#0084FF]/25 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Run First Batch</span>
                          </button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const isSelected = selectedCaseId === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCase(c)}
                      className={`transition-colors cursor-pointer text-[13px] group ${
                        isSelected
                          ? "bg-[#0084FF]/15 hover:bg-[#0084FF]/20"
                          : "hover:bg-[#141C2E]"
                      }`}
                    >
                      {/* Payment ID */}
                      <td className="py-4 px-5 font-mono text-[12px] font-bold text-[#0084FF] whitespace-nowrap">
                        #{c.id.slice(0, 8).toUpperCase()}
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-5">
                      <div className="font-semibold text-[#F8FAFC] leading-tight">
                        {c.customer_name}
                      </div>
                      {c.customer_phone && (
                        <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                          {c.customer_phone}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-5 font-mono font-bold text-[#F8FAFC] whitespace-nowrap text-[14px]">
                      {formatCurrency(c.amount)}
                    </td>

                    {/* Root Cause */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <RootCauseBadge cause={c.root_cause} method={c.diagnosis_method} />
                        {c.diagnosis_confidence !== undefined && (
                          <span className="text-[11px] font-mono font-medium text-[#94A3B8]">
                            {Math.round((c.diagnosis_confidence || 0) * 100)}%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Attempts */}
                    {!compact && (
                      <td className="py-4 px-5 font-mono text-[12px] text-[#94A3B8]">
                        <span className="font-semibold text-[#F8FAFC]">
                          {c.retry_count ? c.retry_count : (c.status === "recovered" ? 1 : 0)}
                        </span>/3
                      </td>
                    )}

                    {/* Action */}
                    <td className="py-4 px-5">
                      <ActionTag action={c.policy_action} />
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Updated */}
                    <td suppressHydrationWarning className="py-4 px-5 text-[12px] font-mono text-[#94A3B8] whitespace-nowrap">
                      {formatDate(c.updated_at || c.created_at)}
                    </td>

                    {/* Inspect */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c);
                        }}
                        className="p-1.5 rounded-lg text-[#64748B] group-hover:text-[#F8FAFC] group-hover:bg-[#1C273E] transition-colors"
                        title="Inspect case details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
