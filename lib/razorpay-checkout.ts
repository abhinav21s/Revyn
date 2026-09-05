"use client";

export interface LaunchCheckoutParams {
  amount: number; // in paise
  caseId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  merchantName?: string;
  onSuccess?: (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => void;
  onFailure?: (response: any) => void;
  onDismiss?: () => void;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      // Script tag already in DOM but may not have fired load yet
      const onLoad = () => resolve(true);
      const onErr = () => resolve(false);
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onErr, { once: true });
      // If already loaded (readyState check for Safari)
      if ((window as any).Razorpay) resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function launchRazorpayCheckout({
  amount,
  caseId,
  customerName = "Rahul Verma",
  customerEmail = "customer@example.com",
  customerPhone = "9876543210",
  merchantName = "Revyn AI Revenue Recovery",
  onSuccess,
  onFailure,
  onDismiss,
}: LaunchCheckoutParams): Promise<boolean> {
  try {
    // Step 1: Load the Razorpay checkout.js SDK
    const loaded = await loadRazorpayScript();
    if (!loaded || typeof window === "undefined" || !(window as any).Razorpay) {
      console.error("[Razorpay] checkout.js failed to load");
      return false;
    }

    // Step 2: Create a Razorpay Order server-side first.
    // This is REQUIRED — opening checkout without an order_id causes
    // Razorpay to reject valid cards with misleading "invalid card" errors.
    let orderId: string | undefined;
    let orderAmount = amount;
    let keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          case_id: caseId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        orderId = data.order_id;
        orderAmount = data.amount || amount;
        // Use the key returned from the server (always the correct one)
        if (data.key_id) keyId = data.key_id;
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error("[Razorpay] Order creation failed:", errBody);
      }
    } catch (err) {
      console.error("[Razorpay] Network error creating order:", err);
    }

    // Validate that we have a real key
    if (!keyId || !keyId.startsWith("rzp_test_")) {
      console.error("[Razorpay] Missing or invalid NEXT_PUBLIC_RAZORPAY_KEY_ID");
      alert(
        "Razorpay key is missing.\n\nAdd NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_... to your .env and restart the dev server."
      );
      return false;
    }

    // Validate we have a real order ID (not a fake fallback)
    if (!orderId || orderId.startsWith("order_test_")) {
      console.warn("[Razorpay] Using checkout without a valid server order_id — card payments may fail.");
    }

    const cleanPhone = customerPhone.replace(/\D/g, "").slice(-10) || "9876543210";

    // Step 3: Open Razorpay Standard Checkout with the order_id
    const options: any = {
      key: keyId,
      amount: orderAmount,
      currency: "INR",
      name: merchantName,
      description: `Recovery Payment · #${caseId.slice(0, 8).toUpperCase()}`,
      image: "/icon.svg",
      // Pass the order_id — this is what makes card payments work properly
      ...(orderId && !orderId.startsWith("order_test_") && { order_id: orderId }),
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: cleanPhone,
      },
      notes: {
        revyn_case_id: caseId,
        environment: "test",
      },
      theme: {
        color: "#0084FF",
      },
      handler: async function (response: any) {
        // Payment succeeded — mark case as recovered
        try {
          await fetch("/api/recover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              case_id: caseId,
              simulate_recovery: true,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
        } catch (err) {
          console.error("[Razorpay] Recovery record error:", err);
        }
        if (onSuccess) onSuccess(response);
      },
      modal: {
        ondismiss: function () {
          if (onDismiss) onDismiss();
        },
        confirm_close: true,
        escape: true,
      },
    };

    const rzp = new (window as any).Razorpay(options);

    // Catch payment errors from Razorpay (e.g., bank decline, invalid OTP)
    rzp.on("payment.failed", async function (response: any) {
      const err = response?.error || {};
      const errCode = err.code || "PAYMENT_FAILED";
      const errDesc = err.description || err.reason || "Payment declined / failed";

      try {
        await fetch("/api/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            case_id: caseId,
            record_failure: true,
            error_code: errCode,
            error_description: errDesc,
          }),
        });
      } catch {
        // silent catch
      }
      if (onFailure) onFailure(response);
    });

    rzp.open();
    return true;
  } catch (error) {
    console.error("[Razorpay] Launch error:", error);
    return false;
  }
}
