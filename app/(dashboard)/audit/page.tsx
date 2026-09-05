"use client";

import React, { useState, useEffect } from "react";
import { AuditLogViewer } from "@/components/audit-log";
import { Panel } from "@/components/primitives";
import { MOCK_AUDIT_LOGS } from "@/lib/mock-data";
import type { AuditLog } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

// In-memory cache for audit records across tab navigation
let cachedAuditLogs: AuditLog[] | null = null;

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(() => cachedAuditLogs || MOCK_AUDIT_LOGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cachedAuditLogs) {
      loadAuditLogs();
    }

    const handleBatch = () => loadAuditLogs();
    window.addEventListener("revyn:batch-completed", handleBatch);
    return () => window.removeEventListener("revyn:batch-completed", handleBatch);
  }, []);

  const loadAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit?limit=200");
      if (res.ok) {
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          cachedAuditLogs = data.logs;
          setLogs(data.logs);
        }
      }
    } catch (e) {
      console.error("Using deterministic audit ledger:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Card ── */}
      <div
        className="p-5 rounded-xl border border-[#1C273E] bg-[#0F1523] shadow-lg shadow-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#0084FF]/30 bg-[#0084FF]/12 text-[#0084FF] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#F8FAFC]">
              Tamper-Evident Policy Audit Ledger
            </h3>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Cryptographically verified trace across DETECT → DIAGNOSE → DECIDE → EXECUTE → MEASURE
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1C273E]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Total Audit Records
          </div>
          <div className="text-[26px] font-black font-mono tracking-tight text-[#F8FAFC]">
            {logs.length}
          </div>
        </div>
      </div>

      {/* ── Full Width Audit Trail Panel (No Split Screen) ── */}
      <Panel
        title="Audit trail ledger"
        description="Click any transaction row to expand the 5-stage execution timeline and cryptographic proof"
      >
        <AuditLogViewer
          logs={logs}
          loading={loading}
          onRefresh={loadAuditLogs}
        />
      </Panel>
    </div>
  );
}
