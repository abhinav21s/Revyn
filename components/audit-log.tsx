"use client";

import React, { useState } from "react";
import type { AuditLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
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
    <tr className="border-b border-[#374151]/40">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="py-4 px-5">
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
      {/* ── Controls ────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-[#374151]/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 w-full sm:w-auto">
          {steps.map((st) => (
            <button
              key={st.value}
              onClick={() => setStepFilter(st.value)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                stepFilter === st.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-[#1F2937]/60 text-zinc-400 hover:text-zinc-200 hover:bg-[#1F2937]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actions, reasons, rules…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#374151]/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-zinc-400 hover:text-zinc-200 border border-[#374151]/60 transition-all"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#374151]/60 bg-[#0B0F19]/40">
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Step</th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Action</th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Reason</th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Policy Rule</th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Actor</th>
              <th className="py-3.5 px-5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
              <th className="py-3.5 px-5 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Details</th>
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
                    <div className="w-16 h-16 rounded-2xl bg-[#1F2937] border border-[#374151]/60 flex items-center justify-center">
                      <FileSpreadsheet className="w-8 h-8 text-zinc-600" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-zinc-300">
                        {search || stepFilter !== "all" ? "No logs match your filter" : "Audit ledger is empty"}
                      </p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
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
                      className="border-b border-[#374151]/30 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border font-mono ${stepColor}`}>
                          {log.step}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-sm font-semibold text-white max-w-[180px] truncate">
                        {log.action}
                      </td>
                      <td className="py-4 px-5 text-sm text-zinc-400 max-w-[240px] truncate">
                        {log.reason}
                      </td>
                      <td className="py-4 px-5">
                        {log.policy_rule ? (
                          <span className="font-mono text-blue-400 text-xs bg-blue-500/8 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                            {log.policy_rule}
                          </span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-xs text-zinc-500 font-mono">{log.actor}</td>
                      <td className="py-4 px-5 text-xs text-zinc-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button className="p-1.5 rounded-lg bg-[#1F2937] group-hover:bg-[#374151] text-zinc-500 hover:text-zinc-200 transition-colors">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded JSON Inspector */}
                    {isExpanded && (
                      <tr className="bg-[#0B0F19]/60">
                        <td colSpan={7} className="px-5 py-4 border-b border-[#374151]/40">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                              <Code className="w-3.5 h-3.5 text-blue-400" />
                              <span>Audit Entry Details</span>
                              <span className="text-[10px] font-mono text-zinc-600 ml-1">ID: {log.id}</span>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                              <span className="text-zinc-500">Full Reason: </span>
                              {log.reason}
                            </p>
                            {log.metadata && (
                              <pre className="p-4 rounded-xl bg-[#070A12] border border-[#374151]/60 text-[11px] font-mono text-emerald-400/90 overflow-x-auto leading-relaxed">
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
