"use client";

import React from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { BatchMetrics } from "@/lib/types";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

interface MetricsCardsProps {
  metrics: BatchMetrics | null;
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl bg-[#111827] border border-[#374151]/60 space-y-4 animate-pulse shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-3 w-28 bg-[#374151]/80 rounded-full" />
        <div className="w-9 h-9 rounded-xl bg-[#1F2937]" />
      </div>
      <div className="h-8 w-32 bg-[#374151]/80 rounded-lg" />
      <div className="h-3 w-48 bg-[#374151]/50 rounded-full" />
    </div>
  );
}

export function MetricsCards({ metrics, loading = false }: MetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const total = metrics?.total_cases ?? 0;
  const totalAtRisk = metrics?.total_at_risk_paise ?? 0;
  const recovered = metrics?.recovered_paise ?? 0;
  const recoveryRate = metrics?.recovery_rate ?? 0;
  const escalated = metrics?.escalated_count ?? 0;
  const unrecoverable = metrics?.unrecoverable_count ?? 0;
  const baseline = metrics?.baseline_recovery_rate ?? 0.22;
  const lift = metrics?.lift_over_baseline ?? 0;
  const isLiftPositive = lift > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1 – Total Revenue at Risk */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#374151]/60 shadow-sm hover:border-[#374151] hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Revenue at Risk
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/15 transition-colors">
            <AlertCircle className="w-4.5 h-4.5 text-amber-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-white tracking-tight mb-2">
          {total === 0 ? "₹—" : formatCurrency(totalAtRisk)}
        </div>
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          {total === 0 ? (
            <span className="italic">Run a batch to populate metrics</span>
          ) : (
            <>
              <span className="text-zinc-300 font-semibold">{total}</span>
              <span>total payment failures ingested</span>
            </>
          )}
        </p>
      </div>

      {/* Card 2 – Recovered Revenue */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#374151]/60 shadow-sm hover:border-emerald-500/30 hover:shadow-emerald-900/20 hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Recovered Revenue
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-emerald-400 tracking-tight mb-2">
          {total === 0 ? "₹—" : formatCurrency(recovered)}
        </div>
        <p className="text-xs text-zinc-500 flex items-center gap-1">
          {total === 0 ? (
            <span className="italic">No recoveries yet</span>
          ) : (
            <>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Verified via Razorpay Test Mode</span>
            </>
          )}
        </p>
      </div>

      {/* Card 3 – Recovery Rate & Lift */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#374151]/60 shadow-sm hover:border-blue-500/30 hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
            Recovery Rate
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
            <TrendingUp className="w-4.5 h-4.5 text-blue-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-white tracking-tight mb-2">
          {total === 0 ? "—%" : formatPercent(recoveryRate)}
        </div>
        <div className="flex items-center gap-1.5">
          {total > 0 && (
            <span
              className={`text-xs font-semibold flex items-center gap-0.5 ${
                isLiftPositive ? "text-emerald-400" : "text-zinc-400"
              }`}
            >
              {isLiftPositive ? "+" : ""}
              {formatPercent(Math.abs(lift))} lift
            </span>
          )}
          <span className="text-xs text-zinc-500">
            vs naive baseline ({formatPercent(baseline)})
          </span>
        </div>
      </div>

      {/* Card 4 – Safety Stops */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#374151]/60 shadow-sm hover:border-purple-500/30 hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
            Safety Stops
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/15 transition-colors">
            <ShieldCheck className="w-4.5 h-4.5 text-purple-400" />
          </div>
        </div>
        <div className="text-3xl font-bold text-white tracking-tight mb-2">
          {total === 0 ? "—" : escalated + unrecoverable}
        </div>
        <div className="text-xs text-zinc-500 flex items-center gap-2 flex-wrap">
          {total === 0 ? (
            <span className="italic">Policy violations: 0</span>
          ) : (
            <>
              <span>
                <span className="text-purple-400 font-semibold">{escalated}</span> escalated
              </span>
              <span className="text-zinc-700">·</span>
              <span>
                <span className="text-zinc-300 font-semibold">{unrecoverable}</span> unrecoverable
              </span>
              <span className="text-zinc-700">·</span>
              <span className="text-emerald-400 font-semibold">0 violations</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
