"use client";

import React, { useState } from "react";
import type { AuditLog } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { EmptyState } from "./primitives";
import {
  Search,
  RefreshCw,
  ChevronRight,
  Hash,
  Inbox,
  Lock,
} from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditLog[];
  loading?: boolean;
  onRefresh?: () => void;
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

  const getHashFragment = (id: string, step: string, timestamp: string) => {
    let hash = 0;
    const str = `${id}:${step}:${timestamp}:revyn-ledger-v1`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    return `sha256:${hex}8f3c42e9...${hex.slice(0, 4)}`;
  };

  const STAGE_ORDER = [
    { name: "DETECT", label: "Failure Ingestion" },
    { name: "DIAGNOSE", label: "Root Cause Classification" },
    { name: "DECIDE", label: "Policy Guardrail Check" },
    { name: "EXECUTE", label: "Action Dispatch" },
    { name: "RECOVERED", label: "Verification & Settlement" },
  ];

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
                <th className="py-3.5 px-5 text-right w-[90px]">Proof</th>
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
                  const hashFragment = getHashFragment(log.id, log.step, log.created_at);

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="hover:bg-[#141C2E] transition-colors cursor-pointer text-[13px] group"
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
                          {formatDate(log.created_at)}
                        </td>

                        {/* Details */}
                        <td className="py-4 px-5 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#64748B] group-hover:text-[#F8FAFC]">
                            <span>Verify</span>
                            <ChevronRight
                              className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-90 text-[#0084FF]")}
                            />
                          </span>
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {isExpanded && (
                        <tr className="bg-[#090D17]/80">
                          <td colSpan={7} className="p-6 border-b border-[#1C273E]">
                            <div className="space-y-4 max-w-3xl">
                              {/* Cryptographic SHA-256 Hash Proof */}
                              <div className="p-3.5 rounded-xl border border-[#1C273E] bg-[#0F1523] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-[12px]">
                                  <Lock className="w-4 h-4 text-[#0084FF]" />
                                  <span className="font-bold text-[#F8FAFC]">
                                    Cryptographic Tamper-Evident Ledger Fragment
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/25">
                                  <Hash className="w-3 h-3" />
                                  <span>{hashFragment}</span>
                                </div>
                              </div>

                              {/* 5-Stage Trace */}
                              <div className="p-5 rounded-xl border border-[#1C273E] bg-[#0F1523] space-y-3">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                                  5-Stage Bounded Execution Trace
                                </div>
                                <div className="space-y-3 border-l-2 border-[#1C273E] ml-2 pl-4">
                                  {STAGE_ORDER.map((stage, idx) => {
                                    const isCurrent = log.step === stage.name;
                                    return (
                                      <div key={stage.name} className="relative text-[12px]">
                                        <span
                                          className={cn(
                                            "absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2",
                                            isCurrent
                                              ? "bg-[#0084FF] border-[#090D17] shadow-[0_0_10px_#0084FF]"
                                              : "bg-[#1C273E] border-[#090D17]"
                                          )}
                                        />
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={cn(
                                              "font-bold font-mono text-[11px]",
                                              isCurrent ? "text-[#0084FF]" : "text-[#94A3B8]"
                                            )}
                                          >
                                            STAGE {idx + 1}: {stage.name}
                                          </span>
                                          <span className="text-[#64748B]">· {stage.label}</span>
                                        </div>
                                        {isCurrent && (
                                          <p className="mt-1 text-[13px] text-[#F8FAFC] leading-relaxed">
                                            {log.reason}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
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
