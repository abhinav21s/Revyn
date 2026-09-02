"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { RecoveryTable } from "@/components/recovery-table";
import { CaseDetail } from "@/components/case-detail";
import type { PaymentCase } from "@/lib/types";
import { Layers, RefreshCw } from "lucide-react";

export default function RecoveriesPage() {
  const [cases, setCases] = useState<PaymentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<PaymentCase | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cases?limit=100");
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
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
        title="Recovery Workspace"
        subtitle="Manage and inspect all failed payment recovery cases across merchants"
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              All Payment Cases ({cases.length})
            </h2>
          </div>
        </div>

        <RecoveryTable
          cases={cases}
          loading={loading}
          onSelectCase={(c) => setSelectedCase(c)}
          onRefresh={loadCases}
        />
      </div>

      <CaseDetail
        paymentCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onCaseUpdated={loadCases}
      />
    </div>
  );
}
