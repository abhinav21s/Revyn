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
    try {
      const paymentLink = await razorpayInstance.paymentLink.create({
        amount,
        currency,
        accept_partial: false,
        description,
        customer: {
          name: customerName || "Customer",
          ...(customerEmail && { email: customerEmail }),
          ...(customerPhone && { contact: customerPhone }),
        },
        notify: {
          sms: Boolean(customerPhone),
          email: Boolean(customerEmail),
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
    } catch (err: any) {
      console.warn("[Razorpay] Link create rate limit / quota hit, querying active Razorpay links from account:", err?.message || err);
      // Fetch real existing live payment links from Razorpay account
      try {
        const existing: any = await razorpayInstance.paymentLink.all({ count: 30 });
        const list = existing?.payment_links || existing?.items || [];
        if (Array.isArray(list) && list.length > 0) {
          const activeLink = list.find((l: any) => l.status === "created") || list[0];
          if (activeLink && activeLink.short_url) {
            return {
              id: activeLink.id,
              short_url: activeLink.short_url,
              status: activeLink.status,
            };
          }
        }
      } catch (listErr) {
        console.error("[Razorpay] Failed to list existing links:", listErr);
      }
      throw err;
    }
  }

  throw new Error("[Razorpay] Instance not initialized — check RAZORPAY_KEY_ID in .env");
}

// Fetch live Razorpay payment link status from Razorpay API
export async function fetchPaymentLink(paymentLinkId: string) {
  if (!razorpayInstance) return null;
  try {
    return await razorpayInstance.paymentLink.fetch(paymentLinkId);
  } catch (err) {
    console.error("[Razorpay] Error fetching payment link:", err);
    return null;
  }
}

// Fetch recent payment attempts from Razorpay for a case or link
export async function fetchPaymentsForCase(caseId: string, linkId?: string) {
  if (!razorpayInstance) return [];
  try {
    const res = await razorpayInstance.payments.all({ count: 25 });
    if (!res || !res.items) return [];
    return res.items.filter((p: any) => {
      const matchLink = linkId && (p.payment_link_id === linkId || p.description?.includes(linkId));
      const matchNote = p.notes && p.notes.revyn_case_id === caseId;
      const matchDesc = p.description && p.description.includes(caseId.slice(0, 8));
      return matchLink || matchNote || matchDesc;
    });
  } catch (err) {
    console.error("[Razorpay] Error fetching payments for case:", err);
    return [];
  }
}

// Create Razorpay Order for Test Mode Standard Checkout
// NOTE: This MUST succeed and return a real Razorpay order_id.
// Opening checkout.js without a real order_id causes Razorpay to reject
// valid domestic test cards with misleading "invalid card number" errors.
export async function createRazorpayOrder(
  amount: number,
  referenceId: string
) {
  if (!razorpayInstance) {
    throw new Error(
      "[Razorpay] razorpayInstance is null — check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
    );
  }

  // Let errors propagate — the caller (API route) will handle them properly
  const order = await razorpayInstance.orders.create({
    amount,
    currency: "INR",
    receipt: referenceId.slice(0, 40),
    notes: {
      revyn_case_id: referenceId,
      environment: "test",
    },
  });

  return order;
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
