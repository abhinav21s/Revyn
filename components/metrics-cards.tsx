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

export function MetricsCards({ metrics, loading = false }: MetricsCardsProps) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1 – Revenue at Risk */}
      <div className="p-5 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-[#5B6B85] uppercase tracking-[0.04em]">
              Revenue at Risk
            </span>
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-[24px] font-bold text-[#F4F6FA] tabular-nums tracking-tight">
            {total === 0 ? "₹—" : formatCurrency(totalAtRisk)}
          </div>
        </div>
        <p className="text-[12px] text-[#5B6B85] mt-3">
          {total === 0 ? (
            "Run a batch to populate"
          ) : (
            <>
              <span className="text-[#94A3B8] font-medium">{total}</span> total payment failures
            </>
          )}
        </p>
      </div>

      {/* Card 2 – Recovered Revenue */}
      <div className="p-5 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-[#22C55E] uppercase tracking-[0.04em]">
              Recovered Revenue
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div className="text-[24px] font-bold text-[#22C55E] tabular-nums tracking-tight">
            {total === 0 ? "₹—" : formatCurrency(recovered)}
          </div>
        </div>
        <p className="text-[12px] text-[#5B6B85] mt-3 flex items-center gap-1">
          {total === 0 ? (
            "No recoveries yet"
          ) : (
            <>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Razorpay Test Mode</span>
            </>
          )}
        </p>
      </div>

      {/* Card 3 – Recovery Rate */}
      <div className="p-5 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-[#4F7CFF] uppercase tracking-[0.04em]">
              Recovery Rate
            </span>
            <TrendingUp className="w-4 h-4 text-[#4F7CFF]" />
          </div>
          <div className="text-[24px] font-bold text-[#F4F6FA] tabular-nums tracking-tight">
            {total === 0 ? "—%" : formatPercent(recoveryRate)}
          </div>
        </div>
        <div className="text-[12px] text-[#5B6B85] mt-3 flex items-center gap-1.5">
          {total > 0 && (
            <span
              className={`font-semibold ${
                isLiftPositive ? "text-[#22C55E]" : "text-[#94A3B8]"
              }`}
            >
              {isLiftPositive ? "+" : ""}
              {formatPercent(Math.abs(lift))} lift
            </span>
          )}
          <span>vs naive ({formatPercent(baseline)})</span>
        </div>
      </div>

      {/* Card 4 – Safety Stops */}
      <div className="p-5 rounded-[12px] bg-[#121826] border border-[rgba(38,48,69,0.4)] flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-[0.04em]">
              Safety Stops
            </span>
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div className="text-[24px] font-bold text-[#F4F6FA] tabular-nums tracking-tight">
            {total === 0 ? "—" : escalated + unrecoverable}
          </div>
        </div>
        <p className="text-[12px] text-[#5B6B85] mt-3">
          {total === 0 ? (
            "0 policy violations"
          ) : (
            <>
              <span className="text-[#EF4444] font-medium">{escalated}</span> escalated ·{" "}
              <span className="text-[#94A3B8] font-medium">{unrecoverable}</span> unrec
            </>
          )}
        </p>
      </div>
    </div>
  );
}
