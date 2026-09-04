import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

  try {
    const body = await request.json();
    const { amount, case_id, customer_name, customer_email, customer_phone } = body;

    if (!amount || !case_id) {
      return NextResponse.json({ error: "amount and case_id required" }, { status: 400 });
    }

    const order = await createRazorpayOrder(amount, case_id);
    const orderId = (order as any).id;

    // If the returned order_id is a fake fallback (not from Razorpay), warn in logs
    if (!orderId || orderId.startsWith("order_test_")) {
      console.warn(
        "[Razorpay] Could not create a real order — check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env. " +
        "Card payments will fail without a valid order_id."
      );
    }

    return NextResponse.json({
      order_id: orderId,
      amount: (order as any).amount || amount,
      currency: (order as any).currency || "INR",
      key_id: keyId,
      customer: {
        name: customer_name,
        email: customer_email,
        contact: customer_phone,
      },
    });
  } catch (err) {
    console.error("[Razorpay] create-order error:", err);
    // Do NOT silently fallback to a fake order — return an error so the client knows
    return NextResponse.json(
      {
        error: "Failed to create Razorpay order. Check server logs.",
        // Still return key_id so client can at least open checkout in degraded mode
        key_id: keyId,
      },
      { status: 500 }
    );
  }
}
