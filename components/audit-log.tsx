"use client";

import React, { useState } from "react";
import type { AuditLog } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import {
  Search,
  RefreshCw,
  ChevronRight,
  Code,
  FileSpreadsheet,
} from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditLog[];
  loading?: boolean;
  onRefresh?: () => void;
}

// Skeleton row
function SkeletonAuditRow() {
  return (
    <tr className="border-b border-[#374151]/40 h-[54px]">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="py-2.5 px-5">
          <div
            className={`h-3 rounded-full bg-[#374151]/60 animate-pulse ${
              i === 1 ? "w-16" : i === 2 ? "w-28" : i === 3 ? "w-40" : "w-20"
            }`}
          />
        </td>
      ))}
    </tr>
  );
}

const STEP_COLORS: Record<string, string> = {
  DETECT: "bg-zinc-700/60 text-zinc-300 border-zinc-600",
  DIAGNOSE: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
  DECIDE: "bg-blue-500/10 text-blue-300 border-blue-500/25",
  EXECUTE: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  RECOVERED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  SETTINGS: "bg-rose-500/10 text-rose-300 border-rose-500/25",
  WEBHOOK: "bg-purple-500/10 text-purple-300 border-purple-500/25",
};

export function AuditLogViewer({
  logs,
  loading = false,
  onRefresh,
}: AuditLogViewerProps) {
  const [search, setSearch] = useState("");
  const [stepFilter, setStepFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const steps = [
    { label: "All", value: "all" },
    { label: "DETECT", value: "DETECT" },
    { label: "DIAGNOSE", value: "DIAGNOSE" },
    { label: "DECIDE", value: "DECIDE" },
    { label: "EXECUTE", value: "EXECUTE" },
    { label: "RECOVERED", value: "RECOVERED" },
    { label: "SETTINGS", value: "SETTINGS" },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesStep = stepFilter === "all" || log.step === stepFilter;
    const matchesSearch =
      search === "" ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.reason.toLowerCase().includes(search.toLowerCase()) ||
      log.case_id.toLowerCase().includes(search.toLowerCase()) ||
      (log.policy_rule?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesStep && matchesSearch;
  });

  return (
    <div className="rounded-2xl bg-[#111827] border border-[#374151]/60 shadow-sm overflow-hidden">
      {/* ── Controls (Filter tabs: 28px height, 8px gap) ──────── */}
      <div className="px-5 py-3.5 border-b border-[#374151]/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 w-full sm:w-auto">
          {steps.map((st) => (
            <button
              key={st.value}
              onClick={() => setStepFilter(st.value)}
              className={`h-[28px] flex items-center px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                stepFilter === st.value
                  ? "bg-blue-600 text-white border border-blue-500 shadow-sm"
                  : "bg-[#1F2937]/70 text-zinc-400 hover:text-zinc-200 hover:bg-[#1F2937] border border-transparent"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search actions, reasons, rules…"
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
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table (horizontal scroll with 8px padding bottom) ─── */}
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#374151]/60 bg-[#1F2937]">
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">Step</th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">Action</th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">Reason</th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">Policy Rule</th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">Actor</th>
              <th className="py-3 px-5 text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px] whitespace-nowrap">Timestamp</th>
              <th className="py-3 px-5 text-right text-[11px] font-semibold text-zinc-300 opacity-70 uppercase tracking-[0.5px]">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <SkeletonAuditRow />
                <SkeletonAuditRow />
                <SkeletonAuditRow />
                <SkeletonAuditRow />
                <SkeletonAuditRow />
              </>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 px-5">
                  <div className="flex flex-col items-center justify-center gap-4 text-center max-w-xs mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-[#1F2937] border border-[#374151]/60 flex items-center justify-center">
                      <FileSpreadsheet className="w-7 h-7 text-zinc-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-200">
                        {search || stepFilter !== "all" ? "No logs match your filter" : "Audit ledger is empty"}
                      </p>
                      <p className="text-xs text-zinc-400 opacity-75 leading-relaxed">
                        {search || stepFilter !== "all"
                          ? "Try clearing the search or switching the step filter."
                          : "Run a recovery batch to start generating immutable audit entries."}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const stepColor = STEP_COLORS[log.step] || "bg-zinc-700/60 text-zinc-300 border-zinc-600";
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="h-[54px] border-b border-[#374151]/30 hover:bg-[#1F2937]/40 cursor-pointer transition-colors duration-[120ms] ease-in-out group"
                    >
                      {/* Consistent width STEP badge (84px, centered) */}
                      <td className="py-2.5 px-5">
                        <span className={`w-[84px] h-[22px] inline-flex items-center justify-center rounded-md text-[10px] font-bold border font-mono ${stepColor}`}>
                          {log.step}
                        </span>
                      </td>
                      <td className="py-2.5 px-5 text-sm font-semibold text-white max-w-[180px] truncate leading-tight">
                        {log.action}
                      </td>
                      {/* 2-line clamp with tooltip on hover */}
                      <td className="py-2.5 px-5 text-xs text-zinc-300 max-w-[280px]" title={log.reason}>
                        <span className="line-clamp-2 leading-tight">{log.reason}</span>
                      </td>
                      <td className="py-2.5 px-5">
                        {log.policy_rule ? (
                          <span className="font-mono text-blue-400 text-xs bg-blue-500/8 border border-blue-500/20 px-2 py-0.5 rounded-md">
                            {log.policy_rule}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-5 text-xs text-zinc-400 font-mono">{log.actor}</td>
                      <td className="py-2.5 px-5 text-[11px] text-zinc-400 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-2.5 px-5 text-right">
                        {/* 16px chevron rotating 90deg on open with 150ms transition */}
                        <div className="inline-flex items-center justify-center w-[28px] h-[28px] rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 transition-transform duration-150 ease-out",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Expanded JSON Inspector */}
                    {isExpanded && (
                      <tr className="bg-[#0B0F19]/80">
                        <td colSpan={7} className="px-5 py-4 border-b border-[#374151]/40">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                              <Code className="w-3.5 h-3.5 text-blue-400" />
                              <span>Audit Entry Details</span>
                              <span className="text-[10px] font-mono text-zinc-500 ml-1">ID: {log.id}</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              <span className="text-zinc-500">Full Reason: </span>
                              {log.reason}
                            </p>
                            {log.metadata && (
                              <pre className="p-3.5 rounded-xl bg-[#070A12] border border-[#374151]/60 text-[11px] font-mono text-emerald-400/90 overflow-x-auto leading-relaxed">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
