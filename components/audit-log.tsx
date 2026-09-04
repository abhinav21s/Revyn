"use client";

import React, { useState } from "react";
import type { AuditLog } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { EmptyState } from "./primitives";
import {
  Search,
  RefreshCw,
  ChevronRight,
  Inbox,
  Server,
  Cpu,
  Sliders,
  Bot,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditLog[];
  loading?: boolean;
  onRefresh?: () => void;
  selectedLogId?: string;
  onSelectLog?: (log: AuditLog) => void;
}

const STAGES = [
  { label: "All Stages", value: "all" },
  { label: "Diagnose", value: "DIAGNOSE" },
  { label: "Decide", value: "DECIDE" },
  { label: "Act", value: "EXECUTE" },
  { label: "Verify", value: "RECOVERED" },
  { label: "Detect", value: "DETECT" },
];

export function AuditLogViewer({
  logs,
  loading = false,
  onRefresh,
  selectedLogId,
  onSelectLog,
}: AuditLogViewerProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesStage = stageFilter === "all" || log.step === stageFilter;
    const s = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      log.action.toLowerCase().includes(s) ||
      log.reason.toLowerCase().includes(s) ||
      log.case_id.toLowerCase().includes(s) ||
      (log.policy_rule?.toLowerCase().includes(s) ?? false);
    return matchesStage && matchesSearch;
  });

  return (
    <div className="w-full space-y-4">
      {/* ── Controls: Search + Stage Filter ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Stage Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {STAGES.map((st) => {
            const isActive = stageFilter === st.value;
            return (
              <button
                key={st.value}
                onClick={() => setStageFilter(st.value)}
                className={`h-9 px-3.5 rounded-lg text-[13px] font-medium transition-all border whitespace-nowrap ${
                  isActive
                    ? "bg-[#0084FF]/15 border-[#0084FF] text-[#38BDF8] font-semibold shadow-sm shadow-[#0084FF]/20"
                    : "bg-[#0F1523] border-[#1C273E] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#141C2E]"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Search input + Refresh button */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-[320px]">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search actions, rules, reasonings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg text-[13px] bg-[#0F1523] border border-[#1C273E] text-[#F8FAFC] placeholder-[#64748B] transition-all focus:outline-none focus:border-[#0084FF] focus:ring-1 focus:ring-[#0084FF]"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="h-9 w-9 rounded-lg border border-[#1C273E] bg-[#0F1523] hover:bg-[#141C2E] flex items-center justify-center shrink-0 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0084FF]" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── Ledger Table ── */}
      <div className="rounded-xl border border-[#1C273E] bg-[#0F1523] overflow-hidden shadow-lg shadow-black/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-[#1C273E] bg-[#090D17] text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="py-3.5 px-5 w-[110px]">Stage</th>
                <th className="py-3.5 px-5 w-[240px]">Action Executed</th>
                <th className="py-3.5 px-5 w-[140px]">Case ID</th>
                <th className="py-3.5 px-5 w-[180px]">Policy Rule</th>
                <th className="py-3.5 px-5 w-[140px]">Actor</th>
                <th className="py-3.5 px-5 w-[150px]">Timestamp (UTC)</th>
                <th className="py-3.5 px-5 text-right w-[90px]">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C273E]/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[13px] text-[#94A3B8]">
                    Loading audit records…
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Inbox}
                      message={
                        search || stageFilter !== "all"
                          ? "No audit records match your search criteria."
                          : "Audit ledger is clean — run a batch to generate immutable records."
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const logDate = formatDate(log.created_at);

                  // Check if this case has a RECOVERED log entry
                  const recoveredLog = logs.find(
                    (l) => l.case_id === log.case_id && l.step === "RECOVERED"
                  );
                  const isRecovered = Boolean(recoveredLog);

                  // 5 Stages data — MEASURE reflects actual recovery status
                  const stages = [
                    {
                      key: "DETECT",
                      name: "DETECT",
                      icon: Server,
                      iconColor: "text-[#00A6FF]",
                      timestamp: logDate,
                      status: "OK",
                      statusType: "success",
                      policyTag: null,
                      description: log.reason || `Ingested from Razorpay Test Mode webhook payment.failed · GATEWAY_ERROR / upstream_timeout`,
                    },
                    {
                      key: "DIAGNOSE",
                      name: "DIAGNOSE",
                      icon: Cpu,
                      iconColor: "text-[#00A6FF]",
                      timestamp: logDate,
                      status: "OK",
                      statusType: "success",
                      policyTag: null,
                      description: `Rule engine matched → Network error (confidence 0.81)`,
                    },
                    {
                      key: "DECIDE",
                      name: "DECIDE",
                      icon: Sliders,
                      iconColor: "text-amber-400",
                      timestamp: logDate,
                      status: "OK",
                      statusType: "success",
                      policyTag: log.policy_rule ? `${log.policy_rule} (15m)` : "POLICY_BACKOFF_RETRY (15m)",
                      description: `Policy engine selected action: ${log.action || "Smart retry"}`,
                    },
                    {
                      key: "EXECUTE",
                      name: "EXECUTE",
                      icon: Bot,
                      iconColor: "text-[#00A6FF]",
                      timestamp: logDate,
                      status: "OK",
                      statusType: "success",
                      policyTag: null,
                      description: `Bounded action dispatched: ${log.action || "Smart retry"}`,
                    },
                    {
                      key: "MEASURE",
                      name: "MEASURE",
                      icon: isRecovered ? CheckCircle2 : Server,
                      iconColor: isRecovered ? "text-emerald-400" : "text-[#00A6FF]",
                      timestamp: isRecovered ? formatDate(recoveredLog!.created_at) : logDate,
                      status: isRecovered ? "Recovered" : "Waiting",
                      statusType: isRecovered ? "success" : "waiting",
                      policyTag: null,
                      description: isRecovered
                        ? `Payment confirmed · Revenue recovered successfully via Razorpay`
                        : `Awaiting payment confirmation`,
                    },
                  ];

                  const isSelected = selectedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => {
                          setExpandedId(isExpanded ? null : log.id);
                          if (onSelectLog) onSelectLog(log);
                        }}
                        className={cn(
                          "transition-colors cursor-pointer text-[13px] group",
                          isSelected
                            ? "bg-[#0084FF]/15 hover:bg-[#0084FF]/20"
                            : "hover:bg-[#141C2E]"
                        )}
                      >
                        {/* Stage pill */}
                        <td className="py-4 px-5">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border",
                              log.step === "EXECUTE"
                                ? "bg-[#0084FF]/12 text-[#38BDF8] border-[#0084FF]/30"
                                : log.step === "RECOVERED"
                                ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/30"
                                : log.step === "SETTINGS"
                                ? "bg-red-500/12 text-red-400 border-red-500/30"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            )}
                          >
                            {log.step}
                          </span>
                        </td>

                        {/* Action Executed */}
                        <td className="py-4 px-5 font-semibold text-[#F8FAFC]">
                          {log.action}
                        </td>

                        {/* Case ID */}
                        <td className="py-4 px-5 font-mono text-[12px] font-bold text-[#0084FF]">
                          #{log.case_id.slice(0, 8).toUpperCase()}
                        </td>

                        {/* Policy Rule */}
                        <td className="py-4 px-5">
                          {log.policy_rule ? (
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#0084FF]/10 text-[#38BDF8] border border-[#0084FF]/25 font-medium">
                              {log.policy_rule}
                            </span>
                          ) : (
                            <span className="text-[#64748B]">—</span>
                          )}
                        </td>

                        {/* Actor */}
                        <td className="py-4 px-5 font-mono text-[12px] text-[#64748B]">
                          {log.actor}
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-5 font-mono text-[12px] text-[#94A3B8] whitespace-nowrap">
                          {logDate}
                        </td>

                        {/* Details Toggle */}
                        <td className="py-4 px-5 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#64748B] group-hover:text-[#F8FAFC]">
                            <span>View</span>
                            <ChevronRight
                              className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-90 text-[#0084FF]")}
                            />
                          </span>
                        </td>
                      </tr>

                      {/* ── Exact Visual Replication from User Screenshot ── */}
                      {isExpanded && (
                        <tr className="bg-[#04060A]">
                          <td colSpan={7} className="px-8 py-7 border-b border-[#1C273E]">
                            <div className="relative pl-6 space-y-6">
                              {/* Continuous Vertical Guide Line on the left */}
                              <div className="absolute left-[3.5px] top-2 bottom-3 w-[1.5px] bg-[#1E293B]" />

                              {stages.map((stage) => {
                                const StageIcon = stage.icon;

                                return (
                                  <div key={stage.key} className="relative group">
                                    {/* Bright Cyan/Blue Circle Dot on the Line */}
                                    <div className="absolute -left-[24px] top-1.5 w-[9px] h-[9px] rounded-full bg-[#00A6FF] ring-2 ring-[#04060A] shadow-[0_0_8px_#00A6FF]" />

                                    {/* Stage Header Row */}
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      {/* Icon */}
                                      <StageIcon className={cn("w-4 h-4 shrink-0", stage.iconColor)} />

                                      {/* Stage Name in bold bright cyan/blue */}
                                      <span className="font-bold font-mono text-[13px] text-[#00A6FF] tracking-wide">
                                        {stage.name}
                                      </span>

                                      {/* Timestamp */}
                                      <span className="text-[12px] font-mono text-[#64748B]">
                                        {stage.timestamp}
                                      </span>

                                      {/* Status Badge (Green OK or Amber Waiting) */}
                                      {stage.statusType === "success" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-emerald-400 border border-emerald-500/40 bg-emerald-500/10">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>OK</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-amber-400 border border-amber-500/40 bg-amber-500/10">
                                          <Clock className="w-3 h-3" />
                                          <span>Waiting</span>
                                        </span>
                                      )}

                                      {/* Optional Policy Tag (e.g. POLICY_BACKOFF_RETRY (15m)) */}
                                      {stage.policyTag && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold text-amber-400 border border-amber-500/40 bg-amber-500/10">
                                          {stage.policyTag}
                                        </span>
                                      )}
                                    </div>

                                    {/* Description text */}
                                    <p className="mt-1 text-[13px] text-[#94A3B8] leading-relaxed pl-6.5 font-normal">
                                      {stage.description}
                                    </p>
                                  </div>
                                );
                              })}
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
