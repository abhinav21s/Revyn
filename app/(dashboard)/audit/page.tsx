"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
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
    <div className="space-y-6 md:space-y-8">
      <TopBar
        title="Immutable Audit Ledger"
        subtitle="Every AI diagnosis, policy decision, and execution step — permanently recorded"
      />

      {/* Compliance Header Card (Padding 16px 20px, Margin-bottom 20px, Total Entries align right font-semibold) */}
      <div className="py-4 px-5 mb-5 rounded-2xl bg-[#111827] border border-[#374151]/60 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              Compliance-Grade Audit Standard
            </h3>
            <p className="text-xs text-zinc-400 opacity-75 mt-0.5 leading-normal max-w-xl">
              Every step — DETECT → DIAGNOSE → DECIDE → EXECUTE — is recorded with timestamp, policy rule triggered, and actor signature. No entry is ever deleted or modified.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-zinc-400 font-medium">Total Entries</div>
          <div className="text-2xl font-semibold text-white font-mono tabular-nums leading-tight mt-0.5">
            {loading ? "—" : logs.length}
          </div>
        </div>
      </div>

      <AuditLogViewer
        logs={logs}
        loading={loading}
        onRefresh={loadAuditLogs}
      />
    </div>
  );
}
