// ============================================================
// GET /api/cases
// Fetch payment cases with optional filtering
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    let query = supabaseAdmin
      .from("payment_cases")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,error_code.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cases: data || [], total: count || 0 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cases", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE all cases (for demo reset)
export async function DELETE() {
  try {
    const { error } = await supabaseAdmin
      .from("payment_cases")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "All cases deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete cases", details: String(error) },
      { status: 500 }
    );
  }
}
