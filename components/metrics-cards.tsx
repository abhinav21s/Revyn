"use client";

import React from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { BatchMetrics } from "@/lib/types";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface MetricsCardsProps {
  metrics: BatchMetrics | null;
  loading?: boolean;
}

export function MetricsCards({ metrics, loading = false }: MetricsCardsProps) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-[#111827] border border-[#1F2937] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const isLiftPositive = metrics.lift_over_baseline > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue at Risk */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937] relative overflow-hidden card-hover">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Revenue at Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(metrics.total_at_risk_paise)}
          </div>
          <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
            <span className="font-semibold text-zinc-300">
              {metrics.total_cases}
            </span>{" "}
            total payment failures ingested
          </p>
        </div>

        {/* Card 2: Revenue Recovered */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937] relative overflow-hidden card-hover">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
              Recovered Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatCurrency(metrics.recovered_paise)}
          </div>
          <div className="text-xs text-emerald-300/80 mt-2 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified via Razorpay Test Mode</span>
          </div>
        </div>

        {/* Card 3: Measured Recovery Rate & Baseline Comparison */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937] relative overflow-hidden card-hover">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-blue-400">
              Recovery Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatPercent(metrics.recovery_rate)}
          </div>
          <div className="text-xs mt-2 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center font-semibold ${
                isLiftPositive ? "text-emerald-400" : "text-zinc-400"
              }`}
            >
              +{formatPercent(Math.max(0, metrics.lift_over_baseline))} lift
            </span>
            <span className="text-zinc-400 text-[11px]">
              vs naive retry ({formatPercent(metrics.baseline_recovery_rate)})
            </span>
          </div>
        </div>

        {/* Card 4: Action Breakdown & Exceptions */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937] relative overflow-hidden card-hover">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-purple-400">
              Policy & Safety Stops
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {metrics.escalated_count + metrics.unrecoverable_count}
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
            <span>
              <span className="text-purple-400 font-medium">
                {metrics.escalated_count}
              </span>{" "}
              escalated
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              <span className="text-zinc-300 font-medium">
                {metrics.unrecoverable_count}
              </span>{" "}
              unrecoverable
            </span>
            <span className="text-zinc-600">•</span>
            <span>0 policy violations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
