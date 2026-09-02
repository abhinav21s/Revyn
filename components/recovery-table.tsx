"use client";

import React, { useState } from "react";
import type { PaymentCase } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, RootCauseBadge, ActionBadge } from "./status-badge";
import {
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface RecoveryTableProps {
  cases: PaymentCase[];
  loading?: boolean;
  onSelectCase: (paymentCase: PaymentCase) => void;
  onRefresh?: () => void;
}

export function RecoveryTable({
  cases,
  loading = false,
  onSelectCase,
  onRefresh,
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
    { label: "All Cases", value: "all", count: cases.length },
    {
      label: "Recovered",
      value: "recovered",
      count: cases.filter((c) => c.status === "recovered").length,
    },
    {
      label: "In Progress",
      value: "in_progress",
      count: cases.filter((c) => c.status === "in_progress").length,
    },
    {
      label: "Escalated",
      value: "escalated",
      count: cases.filter((c) => c.status === "escalated").length,
    },
    {
      label: "Unrecoverable",
      value: "unrecoverable",
      count: cases.filter((c) => c.status === "unrecoverable").length,
    },
  ];

  return (
    <div className="rounded-xl bg-[#111827] border border-[#1F2937] overflow-hidden">
      {/* Table Controls */}
      <div className="p-4 border-b border-[#1F2937] flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === tab.value
                  ? "bg-blue-600 text-white shadow"
                  : "bg-[#1F2937]/50 text-zinc-400 hover:text-zinc-200 hover:bg-[#1F2937]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filter === tab.value
                    ? "bg-blue-700 text-white"
                    : "bg-[#111827] text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, error, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-[#1F2937] hover:bg-zinc-700 text-zinc-300 transition"
              title="Refresh Cases"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0F19]/50 text-zinc-400 font-medium uppercase tracking-wider border-b border-[#1F2937]">
            <tr>
              <th className="py-3 px-4">Case / Customer</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Root Cause</th>
              <th className="py-3 px-4">Policy Action</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Ingested</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937] text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Loading payment cases...</span>
                  </div>
                </td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  No payment cases found matching the criteria.
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="hover:bg-[#1F2937]/40 cursor-pointer transition"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">
                      {c.customer_name}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      #{c.id.slice(0, 8)} • {c.merchant_id}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-zinc-200">
                    {formatCurrency(c.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <RootCauseBadge
                      cause={c.root_cause}
                      method={c.diagnosis_method}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <ActionBadge action={c.policy_action} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-[11px]">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition inline-flex items-center gap-1 text-[11px] font-medium"
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
