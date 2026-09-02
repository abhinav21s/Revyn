// ============================================================
// Revyn – Synthetic Payment Data Generator
// Generates realistic failed payment batches for demo/testing
// ============================================================

import type { PaymentCase, RootCause } from "./types";

const MERCHANT_IDS = [
  "merchant_swiggy_clone",
  "merchant_zepto_demo",
  "merchant_meesho_test",
  "merchant_blinkit_dev",
];

const INDIAN_NAMES = [
  "Priya Sharma",
  "Rahul Verma",
  "Anjali Singh",
  "Vikram Patel",
  "Meera Nair",
  "Arjun Kumar",
  "Deepika Iyer",
  "Rohan Gupta",
  "Sneha Reddy",
  "Amit Joshi",
  "Kavya Pillai",
  "Sanjay Mehta",
  "Ritu Agarwal",
  "Nikhil Yadav",
  "Pooja Desai",
  "Karan Khanna",
  "Tanvi Bose",
  "Suresh Babu",
  "Ananya Das",
  "Mohit Sinha",
];

type FailureTemplate = {
  error_code: string;
  error_message: string;
  root_cause: RootCause;
  weight: number; // sampling weight
};

// Realistic failure templates with Indian payment context
const FAILURE_TEMPLATES: FailureTemplate[] = [
  {
    error_code: "BAD_REQUEST_ERROR_INSUFFICIENT_BALANCE",
    error_message: "Your account balance is insufficient for this transaction",
    root_cause: "insufficient_balance",
    weight: 25,
  },
  {
    error_code: "GATEWAY_ERROR_TIMEOUT",
    error_message: "Bank server did not respond within the allowed time",
    root_cause: "bank_timeout",
    weight: 15,
  },
  {
    error_code: "BAD_REQUEST_EMANDATE_REVOKED",
    error_message: "UPI Autopay mandate has been revoked by the customer",
    root_cause: "mandate_revoked",
    weight: 8,
  },
  {
    error_code: "MANDATE_EXPIRED",
    error_message: "UPI Autopay mandate has expired and needs to be renewed",
    root_cause: "mandate_expired",
    weight: 7,
  },
  {
    error_code: "GATEWAY_ERROR_NETWORK_ERROR",
    error_message: "Network connectivity issue between payment gateway and bank",
    root_cause: "network_error",
    weight: 12,
  },
  {
    error_code: "BAD_REQUEST_PAYMENT_CANCELLED_BY_USER",
    error_message: "Payment was cancelled by the customer",
    root_cause: "customer_abandoned",
    weight: 10,
  },
  {
    error_code: "BAD_REQUEST_CARD_EXPIRED",
    error_message: "The card used for payment has expired",
    root_cause: "card_expired",
    weight: 8,
  },
  {
    error_code: "BAD_REQUEST_INVALID_CVV",
    error_message: "Invalid CVV entered for the card",
    root_cause: "invalid_cvv",
    weight: 5,
  },
  {
    error_code: "UPI_SYSTEM_DOWN",
    error_message: "UPI system is currently experiencing downtime",
    root_cause: "upi_downtime",
    weight: 6,
  },
  {
    error_code: "SUBSCRIPTION_CHARGE_FAILED",
    error_message: "Recurring subscription charge failed on the due date",
    root_cause: "subscription_failed",
    weight: 4,
  },
  // Ambiguous cases – will trigger Groq LLM
  {
    error_code: "PAYMENT_FAILED_GW_ERR_12345",
    error_message: "Transaction declined by issuing bank - please contact your bank",
    root_cause: "unknown",
    weight: 3,
  },
  {
    error_code: "TXN_FAILED_RSN_009",
    error_message: "Unable to process payment at this time, please try again later",
    root_cause: "unknown",
    weight: 2,
  },
];

function weightedRandom(templates: FailureTemplate[]): FailureTemplate {
  const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const template of templates) {
    rand -= template.weight;
    if (rand <= 0) return template;
  }
  return templates[0];
}

function randomAmount(): number {
  const amounts = [
    9900, // ₹99
    19900, // ₹199
    29900, // ₹299
    49900, // ₹499
    99900, // ₹999
    149900, // ₹1,499
    199900, // ₹1,999
    299900, // ₹2,999
    499900, // ₹4,999
    800, // ₹8 – below economic floor
    500, // ₹5 – below economic floor
  ];
  if (Math.random() < 0.1) {
    return amounts[Math.floor(Math.random() * 2) + 9];
  }
  return amounts[Math.floor(Math.random() * 9)];
}

function randomPhone(): string {
  const prefixes = ["98", "97", "96", "95", "90", "80", "70"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0");
  return `+91${prefix}${rest}`;
}

export function generateSyntheticBatch(
  count: number = 50
): Omit<PaymentCase, "id" | "created_at" | "updated_at">[] {
  const cases = [];

  for (let i = 0; i < count; i++) {
    const template = weightedRandom(FAILURE_TEMPLATES);
    const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
    const merchantId =
      MERCHANT_IDS[Math.floor(Math.random() * MERCHANT_IDS.length)];

    cases.push({
      merchant_id: merchantId,
      customer_name: name,
      customer_email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      customer_phone: randomPhone(),
      amount: randomAmount(),
      currency: "INR",
      error_code: template.error_code,
      error_message: template.error_message,
      status: "pending" as const,
      retry_count: 0,
    });
  }

  return cases;
}
