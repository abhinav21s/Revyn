"use client";

import React, { useState, useEffect } from "react";
import { AuditLogViewer } from "@/components/audit-log";
import type { AuditLog } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit?limit=200");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[28px] font-bold text-[#F4F6FA] tracking-[-0.02em] leading-tight">
          Immutable Audit Ledger
        </h1>
        <p className="text-[14px] text-[#94A3B8] leading-[1.5] mt-1">
          Cryptographically recorded ledger of every diagnosis, deterministic policy decision, and recovery attempt.
        </p>
      </div>

      {/* Compliance Header Card */}
      <div className="p-5 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[rgba(79,124,255,0.1)] border border-[rgba(79,124,255,0.25)] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#4F7CFF]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#F4F6FA] leading-tight">
              Compliance-Grade Audit Standard
            </h3>
            <p className="text-[13px] text-[#94A3B8] mt-1 leading-normal max-w-xl">
              Every step (DETECT → DIAGNOSE → DECIDE → EXECUTE) is appended with actor signature, policy rule triggered, and UTC timestamp.
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[rgba(38,48,69,0.4)]">
          <div className="text-[12px] text-[#5B6B85] font-semibold uppercase tracking-[0.04em]">
            Total Records
          </div>
          <div className="text-[24px] font-bold text-[#F4F6FA] font-mono tabular-nums mt-0.5">
            {loading ? "—" : logs.length}
          </div>
        </div>
      </div>

      {/* Audit Log Viewer */}
      <AuditLogViewer
        logs={logs}
        loading={loading}
        onRefresh={loadAuditLogs}
      />
    </div>
  );
}
