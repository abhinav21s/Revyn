// ============================================================
// GET /api/audit
// Fetch audit logs with filtering
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("case_id");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");
    const step = searchParams.get("step");

    let query = supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (caseId) {
      query = query.eq("case_id", caseId);
    }

    if (step && step !== "all") {
      query = query.eq("step", step);
    }

    if (search) {
      query = query.or(
        `action.ilike.%${search}%,reason.ilike.%${search}%,policy_rule.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data || [], total: count || 0 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch audit logs", details: String(error) },
      { status: 500 }
    );
  }
}
