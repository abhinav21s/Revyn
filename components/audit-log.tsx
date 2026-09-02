"use client";

import React, { useState } from "react";
import type { AuditLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Code,
} from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditLog[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function AuditLogViewer({
  logs,
  loading = false,
  onRefresh,
}: AuditLogViewerProps) {
  const [search, setSearch] = useState("");
  const [stepFilter, setStepFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const steps = [
    { label: "All Steps", value: "all" },
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
      (log.policy_rule &&
        log.policy_rule.toLowerCase().includes(search.toLowerCase()));
    return matchesStep && matchesSearch;
  });

  const getStepBadgeColor = (step: string) => {
    switch (step) {
      case "DETECT":
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
      case "DIAGNOSE":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "DECIDE":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "EXECUTE":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "RECOVERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "SETTINGS":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="rounded-xl bg-[#111827] border border-[#1F2937] overflow-hidden">
      {/* Search and Filters */}
      <div className="p-4 border-b border-[#1F2937] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {steps.map((st) => (
            <button
              key={st.value}
              onClick={() => setStepFilter(st.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                stepFilter === st.value
                  ? "bg-blue-600 text-white"
                  : "bg-[#1F2937]/50 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-[#1F2937] hover:bg-zinc-700 text-zinc-300 transition"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0F19]/50 text-zinc-400 font-medium uppercase tracking-wider border-b border-[#1F2937]">
            <tr>
              <th className="py-3 px-4">Step</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Reason & Justification</th>
              <th className="py-3 px-4">Policy Rule</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937] text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Loading immutable audit ledger...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  No audit logs found. Run a recovery batch to generate ledger entries.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="hover:bg-[#1F2937]/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${getStepBadgeColor(
                            log.step
                          )}`}
                        >
                          {log.step}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-zinc-300">
                        {log.reason}
                      </td>
                      <td className="py-3 px-4">
                        {log.policy_rule ? (
                          <span className="font-mono text-blue-400 text-[11px] bg-blue-500/10 px-1.5 py-0.5 rounded">
                            {log.policy_rule}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {log.actor}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="p-1 rounded text-zinc-400 hover:text-white">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {/* Expanded JSON Inspector */}
                    {isExpanded && (
                      <tr className="bg-[#0B0F19]/80 border-b border-[#1F2937]">
                        <td colSpan={7} className="p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                            <Code className="w-3.5 h-3.5 text-blue-400" />
                            <span>Audit Log Entry Payload</span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              (ID: {log.id})
                            </span>
                          </div>
                          <div className="text-xs text-zinc-300">
                            <span className="font-semibold text-zinc-400">Full Reason: </span>
                            {log.reason}
                          </div>
                          {log.metadata && (
                            <pre className="p-3 rounded-lg bg-[#070A12] border border-[#1F2937] text-[11px] font-mono text-emerald-400/90 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
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
