"use client";

import React from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { BatchMetrics } from "@/lib/types";
import { MetricCard } from "./primitives";
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";

interface MetricsCardsProps {
  metrics: BatchMetrics | null;
  loading?: boolean;
}

export function MetricsCards({ metrics, loading = false }: MetricsCardsProps) {
  const total = metrics?.total_cases ?? 0;
  const totalAtRisk = metrics?.total_at_risk_paise ?? 0;
  const recovered = metrics?.recovered_paise ?? 0;
  const recoveryRate = metrics?.recovery_rate ?? 0;
  const baseline = metrics?.baseline_recovery_rate ?? 0.22;
  const lift = metrics?.lift_over_baseline ?? 0;

  const pendingAction = metrics?.pending_count ?? 0;
  const escalated = metrics?.escalated_count ?? 0;
  const recoveredCount = Math.round(total * recoveryRate);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total at Risk */}
      <MetricCard
        label="Total at Risk"
        value={loading || total === 0 ? "₹0.00" : formatCurrency(totalAtRisk)}
        icon={AlertCircle}
        iconTint="amber"
        delta={total > 0 ? `${total} failed payments` : "0 cases logged"}
        deltaType="neutral"
        subtitle="via Razorpay test events"
      />

      {/* 2. Recovered */}
      <MetricCard
        label="Recovered"
        value={loading || total === 0 ? "₹0.00" : formatCurrency(recovered)}
        icon={CheckCircle2}
        iconTint="emerald"
        delta={total > 0 ? `${recoveredCount} cases paid` : "Awaiting batch run"}
        deltaType="success"
        subtitle="autonomous resolution"
      />

      {/* 3. Recovery Rate */}
      <MetricCard
        label="Recovery Rate"
        value={loading || total === 0 ? "0.0%" : formatPercent(recoveryRate)}
        icon={TrendingUp}
        iconTint="blue"
        delta={total > 0 && lift > 0 ? `+${formatPercent(lift)} lift` : `${formatPercent(baseline)} baseline`}
        deltaType={lift > 0 ? "success" : "neutral"}
        subtitle={`vs ${formatPercent(baseline)} naïve retry`}
      />

      {/* 4. Pending Action */}
      <MetricCard
        label="Pending Action"
        value={loading ? "0" : `${pendingAction + escalated}`}
        icon={Clock}
        iconTint="red"
        delta={escalated > 0 ? `${escalated} escalated to human` : "All safety stops active"}
        deltaType={escalated > 0 ? "warning" : "neutral"}
        subtitle="in-flight / review queue"
      />
    </div>
  );
}
