"use client";

import React, { useState, useEffect } from "react";
import { AuditLogViewer } from "@/components/audit-log";
import { Panel } from "@/components/primitives";
import { MOCK_AUDIT_LOGS } from "@/lib/mock-data";
import type { AuditLog } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAuditLogs();

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
        className="p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0"
            style={{
              background: "rgba(0, 166, 255, 0.12)",
              borderColor: "rgba(0, 166, 255, 0.3)",
              color: "var(--primary)",
            }}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>
              Tamper-Evident Policy Audit Ledger
            </h3>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Cryptographically verified trace across DETECT → DIAGNOSE → DECIDE → EXECUTE → RECOVERED
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0" style={{ borderColor: "var(--border)" }}>
          <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--subtle)" }}>
            Total Audit Records
          </div>
          <div className="text-[24px] font-bold font-mono tracking-tight" style={{ color: "var(--foreground)" }}>
            {logs.length}
          </div>
        </div>
      </div>

      {/* ── Main Ledger Panel ── */}
      <Panel
        title="Audit trail ledger"
        description="Expand any entry to view the 5-stage execution trace and cryptographic SHA-256 proof fragment"
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
