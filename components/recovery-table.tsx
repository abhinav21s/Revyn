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
      activeStyle: "bg-[rgba(79,124,255,0.12)] text-[#4F7CFF] border-[rgba(79,124,255,0.3)]",
    },
    {
      label: "Recovered",
      value: "recovered",
      count: cases.filter((c) => c.status === "recovered").length,
      activeStyle: "bg-[rgba(34,197,94,0.12)] text-[#22C55E] border-[rgba(34,197,94,0.3)]",
    },
    {
      label: "In Progress",
      value: "in_progress",
      count: cases.filter((c) => c.status === "in_progress").length,
      activeStyle: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]",
    },
    {
      label: "Escalated",
      value: "escalated",
      count: cases.filter((c) => c.status === "escalated").length,
      activeStyle: "bg-[rgba(239,68,68,0.12)] text-[#EF4444] border-[rgba(239,68,68,0.3)]",
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
      {/* ── Section 6: Filter Tabs + Search Bar (height 40px, margin: 16px 0, gap >= 24px) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 my-4">
        {/* Filter Tabs (pill: padding 8px 16px, border-radius 8px, font-size 13px, gap 8px) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`h-[40px] px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors flex items-center border whitespace-nowrap ${
                  isActive
                    ? `${tab.activeStyle} font-semibold`
                    : "bg-transparent text-[#94A3B8] border-transparent hover:bg-[#1A2233]"
                }`}
              >
                <span>{tab.label}</span>
                {/* Count badge: separate small pill after 6px gap, padding 1px 7px, rounded-999px, bg: #1A2233 */}
                <span className="ml-[6px] px-[7px] py-[1px] rounded-full bg-[#1A2233] text-[11px] text-[#94A3B8] font-mono leading-none">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input (position relative, width 320px desktop / 100% mobile, left padding 40px strictly separating icon & text) */}
        <div className="relative w-full sm:w-[320px] shrink-0">
          <Search className="w-4 h-4 text-[#5B6B85] absolute left-[14px] top-[12px] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by case or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[40px] w-full bg-[#121826] border border-[#2E3A52] rounded-[8px] pl-[40px] pr-[14px] text-[14px] text-[#F4F6FA] placeholder-[#5B6B85] focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[rgba(79,124,255,0.2)] transition-all"
          />
        </div>
      </div>

      {/* ── Section 7: Table Container (rounded 12px, background: #121826, border: 1px solid rgba(38,48,69,0.3)) ── */}
      <div className="rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.3)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Header row: bg-[#1A2233], padding 12px 16px per cell, font-size: 12px, font-weight 600, uppercase, letter-spacing 0.04em, color: #5B6B85 */}
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

            {/* Data rows: padding 14px 16px per cell, border-bottom 1px solid rgba(38,48,69,0.3), font-size 13px, hover: bg-[#202B40] */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#5B6B85] text-[13px]">
                    Loading cases…
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                /* Empty state: padding 64px 0, centered, icon 24px + 12px margin + text */
                <tr>
                  <td colSpan={7} className="py-16 px-4 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="w-6 h-6 text-[#5B6B85]" />
                      <p className="text-[14px] text-[#5B6B85] mt-3">
                        {search || filter !== "all"
                          ? "No cases match your filter criteria"
                          : "No cases yet — run a batch to populate this table"}
                      </p>
                      {!search && filter === "all" && onRunBatch && (
                        <button
                          onClick={onRunBatch}
                          className="mt-4 px-5 py-2.5 rounded-[8px] bg-[#4F7CFF] text-white text-[13px] font-semibold hover:bg-[#6B91FF] inline-flex items-center gap-2 transition-all whitespace-nowrap"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Run Batch Recovery</span>
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
                    className="border-b border-[rgba(38,48,69,0.3)] hover:bg-[#202B40] transition-colors cursor-pointer text-[13px]"
                  >
                    {/* Case / Customer */}
                    <td className="py-[14px] px-4">
                      <div className="font-medium text-[#F4F6FA] leading-tight">
                        {c.customer_name}
                      </div>
                      <div className="text-[11px] text-[#5B6B85] font-mono mt-0.5">
                        #{c.id.slice(0, 8)}
                      </div>
                    </td>

                    {/* Amount (tabular-nums font-weight 600) */}
                    <td className="py-[14px] px-4 font-semibold text-[#F4F6FA] tabular-nums">
                      {formatCurrency(c.amount)}
                    </td>

                    {/* Root Cause (monospace pill: padding 3px 10px, radius 6px, bg: #0B0F19, border: #2E3A52, 11px) */}
                    <td className="py-[14px] px-4">
                      <RootCauseBadge cause={c.root_cause} method={c.diagnosis_method} />
                    </td>

                    {/* Policy Action */}
                    <td className="py-[14px] px-4">
                      <ActionBadge action={c.policy_action} />
                    </td>

                    {/* Status (colored pill with 6px dot) */}
                    <td className="py-[14px] px-4">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Ingested */}
                    <td className="py-[14px] px-4 text-[#94A3B8] text-[12px] whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>

                    {/* Action: 32x32px icon button, hover: bg-[#202B40] */}
                    <td className="py-[14px] px-4 text-right">
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
