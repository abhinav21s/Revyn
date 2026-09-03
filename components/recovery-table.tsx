"use client";

import React, { useState } from "react";
import type { PaymentCase } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, RootCauseBadge, ActionBadge } from "./status-badge";
import {
  Search,
  ChevronRight,
  Inbox,
  Play,
} from "lucide-react";

interface RecoveryTableProps {
  cases: PaymentCase[];
  loading?: boolean;
  onSelectCase: (paymentCase: PaymentCase) => void;
  onRefresh?: () => void;
  onRunBatch?: () => void;
}

export function RecoveryTable({
  cases,
  loading = false,
  onSelectCase,
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
    {
      label: "All",
      value: "all",
      count: cases.length,
      activeStyle: "bg-[rgba(79,124,255,0.1)] text-[#4F7CFF] border-[rgba(79,124,255,0.3)]",
    },
    {
      label: "Recovered",
      value: "recovered",
      count: cases.filter((c) => c.status === "recovered").length,
      activeStyle: "bg-[rgba(34,197,94,0.15)] text-[#22C55E] border-[rgba(34,197,94,0.3)]",
    },
    {
      label: "In Progress",
      value: "in_progress",
      count: cases.filter((c) => c.status === "in_progress").length,
      activeStyle: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]",
    },
    {
      label: "Escalated",
      value: "escalated",
      count: cases.filter((c) => c.status === "escalated").length,
      activeStyle: "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]",
    },
    {
      label: "Unrecoverable",
      value: "unrecoverable",
      count: cases.filter((c) => c.status === "unrecoverable").length,
      activeStyle: "bg-[rgba(100,116,139,0.15)] text-[#94A3B8] border-[rgba(100,116,139,0.3)]",
    },
  ];

  return (
    <div className="w-full">
      {/* ── Section 4: Filter Bar + Search Bar Container ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4 border-b border-[rgba(38,48,69,0.4)] mb-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors flex items-center border whitespace-nowrap ${
                  isActive
                    ? tab.activeStyle
                    : "bg-transparent text-[#94A3B8] border-transparent hover:bg-[#1A2233]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#1A2233] text-[11px] text-[#94A3B8] font-mono leading-none">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input (Height: 40px, width: 320px desktop, 100% mobile, left padding 40px for 16px icon) */}
        <div className="relative w-full md:w-[320px]">
          <Search className="w-4 h-4 text-[#5B6B85] absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by case or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[40px] w-full bg-[#121826] border border-[#2E3A52] rounded-[8px] pl-10 pr-4 text-[13px] text-[#F4F6FA] placeholder-[#5B6B85] focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[rgba(79,124,255,0.2)] transition-all"
          />
        </div>
      </div>

      {/* ── Section 5: Table ── */}
      <div className="rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Header row: bg-[#1A2233], 12px font-weight: 600, uppercase, letter-spacing: 0.04em, color: #5B6B85, padding: 12px 16px */}
            <thead>
              <tr className="bg-[#1A2233] border-b border-[#2E3A52]">
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">
                  Case / Customer
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">
                  Amount
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">
                  Root Cause
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">
                  Policy Action
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">
                  Status
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">
                  Ingested
                </th>
                <th className="py-3 px-4 text-right text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">
                  Action
                </th>
              </tr>
            </thead>

            {/* Data rows: padding 14px 16px, border-bottom 1px solid rgba(38,48,69,0.4), font-size: 13px, hover: bg-[#202B40] */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5B6B85] text-[13px]">
                    Loading cases…
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                /* Empty state: padding 48px 0, icon + text "No cases yet — run a batch to populate this table" */
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="w-8 h-8 text-[#5B6B85]" />
                      <p className="text-[14px] text-[#5B6B85]">
                        {search || filter !== "all"
                          ? "No cases match your filter criteria"
                          : "No cases yet — run a batch to populate this table"}
                      </p>
                      {!search && filter === "all" && onRunBatch && (
                        <button
                          onClick={onRunBatch}
                          className="mt-2 px-4 py-2 rounded-[8px] bg-[#4F7CFF] text-white text-[13px] font-semibold hover:bg-[#6B91FF] flex items-center gap-2"
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
                    className="border-b border-[rgba(38,48,69,0.4)] hover:bg-[#202B40] transition-colors cursor-pointer text-[13px]"
                  >
                    {/* Case / Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#F4F6FA] leading-tight">
                        {c.customer_name}
                      </div>
                      <div className="text-[11px] text-[#5B6B85] font-mono mt-0.5">
                        #{c.id.slice(0, 8)}
                      </div>
                    </td>

                    {/* Amount (tabular-nums font-weight 600) */}
                    <td className="py-3.5 px-4 font-semibold text-[#F4F6FA] tabular-nums">
                      {formatCurrency(c.amount)}
                    </td>

                    {/* Root Cause (monospace pill) */}
                    <td className="py-3.5 px-4">
                      <RootCauseBadge cause={c.root_cause} method={c.diagnosis_method} />
                    </td>

                    {/* Policy Action */}
                    <td className="py-3.5 px-4">
                      <ActionBadge action={c.policy_action} />
                    </td>

                    {/* Status (colored pill with dot) */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Ingested */}
                    <td className="py-3.5 px-4 text-[#94A3B8] text-[12px] whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>

                    {/* Action: 32x32px icon button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c);
                        }}
                        className="w-8 h-8 rounded-[6px] hover:bg-[#202B40] text-[#94A3B8] hover:text-[#F4F6FA] inline-flex items-center justify-center transition-colors"
                        title="Inspect case details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
