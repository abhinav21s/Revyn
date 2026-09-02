"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { AuditLogViewer } from "@/components/audit-log";
import type { AuditLog } from "@/lib/types";
import { FileSpreadsheet, ShieldCheck } from "lucide-react";

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
      <TopBar
        title="Immutable Audit Ledger"
        subtitle="Cryptographically auditable log of every AI diagnosis, policy decision, and execution"
      />

      <div className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Compliance & Safety Audit Standard
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Every step from DETECT → DIAGNOSE → DECIDE → EXECUTE is recorded with timestamp, rule trigger, and actor signature.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-zinc-400">Total Entries</span>
          <div className="text-lg font-bold text-white font-mono">{logs.length}</div>
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
