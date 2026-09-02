// ============================================================
// POST /api/diagnose
// Diagnose a single payment failure (Rule engine + Groq fallback)
// ============================================================

import { NextResponse } from "next/server";
import { diagnosePayment } from "@/lib/diagnosis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { error_code, error_message } = body;

    if (!error_code) {
      return NextResponse.json(
        { error: "error_code is required" },
        { status: 400 }
      );
    }

    const diagnosis = await diagnosePayment(
      error_code,
      error_message || "No error message provided"
    );

    return NextResponse.json({
      success: true,
      diagnosis,
    });
  } catch (error) {
    console.error("[Diagnose API] Error:", error);
    return NextResponse.json(
      { error: "Diagnosis failed", details: String(error) },
      { status: 500 }
    );
  }
}
