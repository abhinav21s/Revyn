// ============================================================
// GET/POST /api/settings
// Kill switch + configuration management
// ============================================================

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert to key-value map
    const settings: Record<string, string> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }

    // Check API connections
    const groqConnected = !!process.env.GROQ_API_KEY;
    const razorpayConnected =
      !!process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_");
    const supabaseConnected =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return NextResponse.json({
      settings,
      connections: {
        groq: groqConnected,
        razorpay: razorpayConnected,
        supabase: supabaseConnected,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "key and value are required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log kill switch changes
    if (key === "kill_switch") {
      await writeAuditLog({
        case_id: "system",
        step: "SETTINGS",
        action: value === "true" ? "kill_switch_activated" : "kill_switch_deactivated",
        reason: `Kill switch ${value === "true" ? "ACTIVATED" : "DEACTIVATED"} by operator`,
        policy_rule: "KILL_SWITCH",
        actor: "operator",
        metadata: { key, value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update setting", details: String(error) },
      { status: 500 }
    );
  }
}
