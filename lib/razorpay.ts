// ============================================================
// Revyn – Razorpay Test Mode Integration
// Only creates Payment Links / Orders in Test Mode
// No real money is ever moved.
// ============================================================

import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const isRazorpayConfigured = Boolean(
  keyId &&
    keySecret &&
    keyId.startsWith("rzp_test_") &&
    !keyId.includes("your_key_id")
);

let razorpayInstance: Razorpay | null = null;
if (isRazorpayConfigured) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!,
    });
  } catch (e) {
    console.error("[Razorpay] Init error:", e);
  }
}

export interface CreatePaymentLinkParams {
  amount: number; // in paise
  currency?: string;
  description: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  referenceId: string; // case ID
  expireBy?: number; // Unix timestamp
}

export interface PaymentLinkResult {
  id: string;
  short_url: string;
  status: string;
}

// Create a Razorpay Payment Link (Test Mode)
export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<PaymentLinkResult> {
  const {
    amount,
    currency = "INR",
    description,
    customerName,
    customerEmail,
    customerPhone,
    referenceId,
    expireBy,
  } = params;

  // Default expiry: 48 hours from now
  const defaultExpiry = Math.floor(Date.now() / 1000) + 48 * 60 * 60;

  if (razorpayInstance) {
    const paymentLink = await razorpayInstance.paymentLink.create({
      amount,
      currency,
      accept_partial: false,
      description,
      customer: {
        name: customerName,
        ...(customerEmail && { email: customerEmail }),
        ...(customerPhone && { contact: customerPhone }),
      },
      notify: {
        sms: !!customerPhone,
        email: !!customerEmail,
      },
      reminder_enable: true,
      notes: {
        revyn_case_id: referenceId,
        environment: "test",
      },
      expire_by: expireBy || defaultExpiry,
    } as Parameters<typeof razorpayInstance.paymentLink.create>[0]);

    return {
      id: paymentLink.id,
      short_url: paymentLink.short_url,
      status: paymentLink.status,
    };
  }

  // Graceful fallback for Test Mode Demo simulation
  const randomLinkId = "plink_test_" + Math.random().toString(36).substring(2, 10);
  return {
    id: randomLinkId,
    short_url: `https://rzp.io/i/${randomLinkId}`,
    status: "created",
  };
}

// Verify Razorpay webhook signature
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  try {
    const crypto = require("crypto");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "default_test_secret";
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");
    return expectedSignature === signature;
  } catch {
    return false;
  }
}

// Fetch a payment link by ID (for status check)
export async function getPaymentLink(linkId: string) {
  try {
    if (razorpayInstance) {
      return await razorpayInstance.paymentLink.fetch(linkId);
    }
    return { id: linkId, status: "created", amount: 49900 };
  } catch (error) {
    console.error("[Razorpay] Failed to fetch payment link:", error);
    return null;
  }
}
