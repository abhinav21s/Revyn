# Revyn – Features & Capabilities Catalog
### Razorpay AI Buildathon 2026 | Track 03: AI Revenue Recovery

---

## 1. 🔍 Detection Layer & Ingestion
- **Synthetic Batch Generator:** Generates realistic Indian merchant payment failure batches with weighted distribution across real failure modes (UPI downtime, insufficient balance, timeout, revoked mandates, card issues).
- **Multi-Merchant Support:** Simulates transactions across multiple Indian merchants (`merchant_swiggy_clone`, `merchant_zepto_demo`, `merchant_meesho_test`, `merchant_blinkit_dev`).
- **Razorpay Webhook Listener (`/api/webhook/razorpay`):** Ingests real-time events (`payment_link.paid`) with HMAC-SHA256 signature verification.
- **RESTful Case Ingestion (`/api/cases`):** Supports ingesting external payment batches or querying existing cases with pagination and status filters.

---

## 2. 🧠 Two-Stage Root Cause Diagnosis Engine
- **Deterministic Rule Engine (First Line of Defense):**
  - Instant classification of 15+ standard Razorpay and bank error codes (`BAD_REQUEST_ERROR_INSUFFICIENT_BALANCE`, `GATEWAY_ERROR_TIMEOUT`, `BAD_REQUEST_EMANDATE_REVOKED`, etc.).
  - Regex keyword heuristics on customer error messages for high-confidence matching.
- **Groq LLM Secondary Classifier (For Ambiguous Messages):**
  - Powered by `llama-3.3-70b-versatile` with forced JSON object response schemas.
  - Zero money-moving authority — strictly outputs typed root cause label, confidence score (0.0–1.0), and natural language explanation.
- **Visual AI Indicator:** Badges in the UI explicitly highlight whether a diagnosis was made by the deterministic rule engine or Groq AI.

---

## 3. 🛡️ Deterministic Policy Engine (Core Bounded Guardrails)
- **100% Deterministic Execution:** The LLM is never permitted to decide actions or move funds.
- **Max 3 Retries Limit (`MAX_RETRY_LIMIT`):** Automatically halts and escalates cases to the human review queue after 3 failed attempts to prevent customer harassment.
- **Economic Floor Rule (`ECONOMIC_FLOOR`):** Rejects automated recovery for micro-transactions under ₹10.00 (1000 paise) where processing cost exceeds recovered value.
- **Mandate Hard-Stops (`HARD_STOP_MANDATE`):** Hard stop on revoked/expired UPI AutoPay mandates to guarantee strict RBI compliance.
- **Salary Day Dynamic Windows (`SMART_RETRY`):** Automatically accelerates retry windows to 2 hours during salary days (1st–5th of the month) for insufficient balance issues vs 24 hours standard.
- **Smart Payment Link Generation (`PAYMENT_LINK`):** Triggers instant Razorpay payment links for customer-abandoned or card expiry scenarios.
- **Human Escalation Queue (`UNKNOWN_ESCALATE`):** Routes ambiguous or unhandled failures to manual operator review.

---

## 4. 💳 Razorpay Test Mode Execution Layer
- **Official Razorpay Node.js SDK:** Integrated exclusively in Test Mode with strict prefix validation (`rzp_test_*`).
- **Automated Payment Link Creation:** Generates personalized, branded payment links with 48-hour expirations and customer notification toggles.
- **Webhook Signature Verification:** Cryptographically validates HMAC-SHA256 signatures on inbound Razorpay webhooks.
- **Personalized Hinglish Recovery Copy:** Dynamically generates contextual WhatsApp/SMS recovery messages tailored to Indian consumers based on the diagnosed root cause.

---

## 5. 📜 Immutable Audit Ledger & Compliance
- **Complete End-to-End Audit Trail:** Every step (`DETECT`, `DIAGNOSE`, `DECIDE`, `EXECUTE`, `RECOVERED`, `SETTINGS`) is written with timestamp, policy rule, actor signature, and structured metadata.
- **Interactive Audit Explorer (`/audit`):**
  - Filterable by lifecycle step and searchable by actor, policy rule, or keyword.
  - Expandable JSON inspector to examine the exact metadata payload for any decision.
- **Case-Specific Audit Timeline:** Every payment case drawer features its own localized audit timeline showing its entire lifecycle.

---

## 6. 📊 Real-Time Measurement & Dashboard Metrics
- **Measured Revenue Impact:**
  - **Total Revenue at Risk:** Total monetary volume of ingested payment failures.
  - **Recovered Revenue:** Total money recovered via Razorpay payment links.
  - **Measured Recovery Rate:** Precise recovery percentage ($\approx 35\% - 45\%+$).
  - **Lift vs Naïve Baseline:** Direct mathematical comparison showing percentage points gained over a simple *"retry everything once"* baseline ($\approx 22\%$).
- **Safety & Policy Stop Counters:** Real-time tracking of cases escalated to human review, stopped by economic floor, or stopped by mandate compliance.

---

## 7. 🚨 Safety Controls & Emergency Kill Switch
- **Global Emergency Kill Switch:** Instant toggle with confirmation dialog that halts all automated execution, pauses batch jobs, and safely marks incoming payments as `HALTED`.
- **System Health Monitor (`/settings`):** Live connection status indicators for Razorpay Test Mode, Groq AI, and Supabase PostgreSQL.
- **Policy Guardrails Documentation:** In-app read-only view of all hard-coded policy rules for transparency and demonstration to judges.

---

## 8. 🎨 Professional Fintech UI Design System
- **Dark Theme Aesthetics:** Curated palette (`#0B0F19` background, `#111827` cards, `#3B82F6` primary, `#10B981` success, `#EF4444` danger).
- **Responsive Layout:** Fixed sidebar with collapsible navigation, persistent top bar with environment and safety badges.
- **Interactive Case Drawer:** Slide-over detail drawer for in-depth inspection of diagnosis confidence, policy justification, payment link, Hinglish copy, and audit timeline.
- **One-Click Payment Simulation:** Demo button allowing judges to simulate a customer paying a Razorpay link and observe real-time metric updates.
