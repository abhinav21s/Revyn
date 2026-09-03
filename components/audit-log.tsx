"use client";

import React, { useState } from "react";
import type { AuditLog } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import {
  Search,
  RefreshCw,
  ChevronRight,
  Code,
  Inbox,
} from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditLog[];
  loading?: boolean;
  onRefresh?: () => void;
}

const STEP_COLORS: Record<string, string> = {
  DETECT: "bg-[#1A2233] text-[#94A3B8] border-[#2E3A52]",
  DIAGNOSE: "bg-[rgba(79,124,255,0.15)] text-[#4F7CFF] border-[rgba(79,124,255,0.3)]",
  DECIDE: "bg-[rgba(79,124,255,0.15)] text-[#4F7CFF] border-[rgba(79,124,255,0.3)]",
  EXECUTE: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]",
  RECOVERED: "bg-[rgba(34,197,94,0.15)] text-[#22C55E] border-[rgba(34,197,94,0.3)]",
  SETTINGS: "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]",
  WEBHOOK: "bg-[rgba(79,124,255,0.15)] text-[#4F7CFF] border-[rgba(79,124,255,0.3)]",
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
    <div className="w-full">
      {/* ── Controls (Filter tabs + Search input) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4 border-b border-[rgba(38,48,69,0.4)] mb-4">
        {/* Step Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {steps.map((st) => (
            <button
              key={st.value}
              onClick={() => setStepFilter(st.value)}
              className={`px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors border whitespace-nowrap ${
                stepFilter === st.value
                  ? "bg-[rgba(79,124,255,0.15)] text-[#4F7CFF] border-[rgba(79,124,255,0.3)] font-semibold"
                  : "bg-transparent text-[#94A3B8] border-transparent hover:bg-[#1A2233]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search input + Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-[300px]">
            <Search className="w-4 h-4 text-[#5B6B85] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search actions, reasons, rules…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[40px] w-full bg-[#121826] border border-[#2E3A52] rounded-[8px] pl-10 pr-4 text-[13px] text-[#F4F6FA] placeholder-[#5B6B85] focus:outline-none focus:border-[#4F7CFF] focus:ring-2 focus:ring-[rgba(79,124,255,0.2)] transition-all"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="h-[40px] w-[40px] rounded-[8px] bg-[#121826] border border-[#2E3A52] hover:bg-[#1A2233] text-[#94A3B8] hover:text-[#F4F6FA] flex items-center justify-center shrink-0 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#4F7CFF]" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A2233] border-b border-[#2E3A52]">
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">Step</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">Action</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">Reason</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">Policy Rule</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">Actor</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em] whitespace-nowrap">Timestamp</th>
                <th className="py-3 px-4 text-right text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5B6B85] text-[13px]">
                    Loading audit trail…
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="w-8 h-8 text-[#5B6B85]" />
                      <p className="text-[14px] text-[#5B6B85]">
                        {search || stepFilter !== "all"
                          ? "No audit records match your filter criteria"
                          : "Audit ledger is empty — run a recovery batch to generate immutable records"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const stepColor = STEP_COLORS[log.step] || "bg-[#1A2233] text-[#94A3B8] border-[#2E3A52]";
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="border-b border-[rgba(38,48,69,0.4)] hover:bg-[#202B40] cursor-pointer transition-colors text-[13px]"
                      >
                        {/* Step badge */}
                        <td className="py-3 px-4">
                          <span className={`w-[84px] py-0.5 rounded-[4px] inline-flex items-center justify-center text-[11px] font-mono font-semibold border ${stepColor}`}>
                            {log.step}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 font-medium text-[#F4F6FA] max-w-[180px] truncate">
                          {log.action}
                        </td>

                        {/* Reason with 2-line clamp and tooltip */}
                        <td className="py-3 px-4 text-[#94A3B8] max-w-[280px]" title={log.reason}>
                          <span className="line-clamp-2 leading-snug">{log.reason}</span>
                        </td>

                        {/* Policy Rule */}
                        <td className="py-3 px-4">
                          {log.policy_rule ? (
                            <span className="font-mono text-[#4F7CFF] text-[11px] bg-[rgba(79,124,255,0.1)] border border-[rgba(79,124,255,0.25)] px-2 py-0.5 rounded-[4px]">
                              {log.policy_rule}
                            </span>
                          ) : (
                            <span className="text-[#5B6B85] text-xs">—</span>
                          )}
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-4 text-[#5B6B85] text-[12px] font-mono">{log.actor}</td>

                        {/* Timestamp */}
                        <td className="py-3 px-4 text-[#94A3B8] text-[12px] whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>

                        {/* Details Chevron */}
                        <td className="py-3 px-4 text-right">
                          <button className="w-7 h-7 rounded-[6px] hover:bg-[#1A2233] text-[#94A3B8] hover:text-[#F4F6FA] inline-flex items-center justify-center transition-colors">
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 transition-transform duration-150",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded JSON Inspector */}
                      {isExpanded && (
                        <tr className="bg-[#0B0F19]">
                          <td colSpan={7} className="px-6 py-4 border-b border-[#2E3A52]">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[12px] font-medium text-[#94A3B8]">
                                <Code className="w-3.5 h-3.5 text-[#4F7CFF]" />
                                <span>Audit Metadata Record</span>
                                <span className="text-[10px] font-mono text-[#5B6B85] ml-1">ID: {log.id}</span>
                              </div>
                              <p className="text-[13px] text-[#F4F6FA] leading-relaxed">
                                <span className="text-[#5B6B85]">Full Reason: </span>
                                {log.reason}
                              </p>
                              {log.metadata && (
                                <pre className="p-3 rounded-[8px] bg-[#121826] border border-[#2E3A52] text-[11px] font-mono text-[#22C55E] overflow-x-auto leading-relaxed">
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
    </div>
  );
}
