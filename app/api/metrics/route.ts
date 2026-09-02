// ============================================================
// GET /api/metrics
// Compute dashboard metrics from current cases
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { BatchMetrics } from "@/lib/types";

const BASELINE_RECOVERY_RATE = 0.22; // Naïve retry-everything baseline

export async function GET() {
  try {
    const { data: cases, error } = await supabaseAdmin
      .from("payment_cases")
      .select("amount, status, recovered_amount");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!cases || cases.length === 0) {
      return NextResponse.json({
        total_cases: 0,
        total_at_risk_paise: 0,
        recovered_paise: 0,
        recovery_rate: 0,
        pending_count: 0,
        escalated_count: 0,
        unrecoverable_count: 0,
        halted_count: 0,
        baseline_recovery_rate: BASELINE_RECOVERY_RATE,
        lift_over_baseline: 0,
      } as BatchMetrics);
    }

    const total_at_risk_paise = cases.reduce(
      (sum: number, c: any) => sum + (Number(c.amount) || 0),
      0
    );
    const recovered_paise = cases
      .filter((c: any) => c.status === "recovered")
      .reduce(
        (sum: number, c: any) =>
          sum + (Number(c.recovered_amount) || Number(c.amount) || 0),
        0
      );

    const recovery_rate =
      total_at_risk_paise > 0 ? recovered_paise / total_at_risk_paise : 0;

    const metrics: BatchMetrics = {
      total_cases: cases.length,
      total_at_risk_paise,
      recovered_paise,
      recovery_rate,
      pending_count: cases.filter((c: any) => c.status === "pending").length,
      escalated_count: cases.filter((c: any) => c.status === "escalated").length,
      unrecoverable_count: cases.filter((c: any) => c.status === "unrecoverable").length,
      halted_count: cases.filter((c: any) => c.status === "halted").length,
      baseline_recovery_rate: BASELINE_RECOVERY_RATE,
      lift_over_baseline: recovery_rate - BASELINE_RECOVERY_RATE,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compute metrics", details: String(error) },
      { status: 500 }
    );
  }
}
