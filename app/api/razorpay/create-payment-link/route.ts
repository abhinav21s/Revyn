// ============================================================
// POST /api/razorpay/create-payment-link
// Creates a REAL Razorpay Hosted Payment Link via Razorpay API
// ============================================================

import { NextResponse } from "next/server";
import { createPaymentLink } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  let case_id: string | undefined;
  try {
    const body = await request.json();
    case_id = body?.case_id;

    if (!case_id) {
      return NextResponse.json({ error: "Missing case_id" }, { status: 400 });
    }

    // Check if case exists in database
    const { data: paymentCase, error } = await supabaseAdmin
      .from("payment_cases")
      .select("*")
      .eq("id", case_id)
      .single();

    if (error || !paymentCase) {
      // Create on-the-fly for any valid case ID
      const link = await createPaymentLink({
        amount: 19900,
        description: `Revyn Recovery: #${case_id.slice(0, 8)}`,
        customerName: "Customer",
        customerEmail: "customer@example.com",
        customerPhone: "+919876543210",
        referenceId: case_id,
      });

      return NextResponse.json({
        success: true,
        payment_link_url: link.short_url,
        payment_link_id: link.id,
      });
    }

    // If case already has a live Razorpay link, return it
    if (
      paymentCase.payment_link_url &&
      (paymentCase.payment_link_url.includes("https://rzp.io/rzp/") ||
        paymentCase.payment_link_url.includes("https://rzp.io/i/plink_"))
    ) {
      if (!paymentCase.payment_link_id) {
        const match = paymentCase.payment_link_url.match(/plink_[a-zA-Z0-9]+/);
        if (match) {
          await supabaseAdmin
            .from("payment_cases")
            .update({ payment_link_id: match[0] })
            .eq("id", paymentCase.id);
        }
      }
      return NextResponse.json({
        success: true,
        payment_link_url: paymentCase.payment_link_url,
        payment_link_id: paymentCase.payment_link_id,
      });
    }

    // Generate real Razorpay Payment Link
    const link = await createPaymentLink({
      amount: paymentCase.amount,
      description: `Revyn Recovery for ${paymentCase.customer_name}`,
      customerName: paymentCase.customer_name,
      customerEmail: paymentCase.customer_email,
      customerPhone: paymentCase.customer_phone || "+919876543210",
      referenceId: paymentCase.id,
    });

    // Update database
    await supabaseAdmin
      .from("payment_cases")
      .update({
        payment_link_url: link.short_url,
        payment_link_id: link.id,
      })
      .eq("id", paymentCase.id);

    // Record audit log
    await writeAuditLog({
      case_id: paymentCase.id,
      step: "EXECUTE",
      action: "razorpay_link_generated",
      reason: `Live Razorpay hosted link generated: ${link.short_url}`,
      policy_rule: "PAYMENT_LINK_DISPATCH",
      actor: "razorpay-api",
      metadata: { link_id: link.id, short_url: link.short_url },
    });

    return NextResponse.json({
      success: true,
      payment_link_url: link.short_url,
      payment_link_id: link.id,
    });
  } catch (error: any) {
    console.error("[Create Payment Link API] Error:", error);

    return NextResponse.json(
      { error: "Failed to generate Razorpay link", details: String(error?.message || error) },
      { status: 500 }
    );
  }
}
