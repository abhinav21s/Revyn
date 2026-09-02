# Revyn – Bounded Payment Recovery Agent
### Razorpay AI Buildathon 2026 | Track 03: AI Revenue Recovery

Revyn is an autonomous, bounded AI payment recovery agent built specifically for Indian merchants using **Razorpay Test Mode**. It closes the loop across:

$$\text{Detection} \longrightarrow \text{Diagnosis} \longrightarrow \text{Policy Decision} \longrightarrow \text{Safe Execution} \longrightarrow \text{Measurement \& Audit}$$

---

## 🚀 Key Highlights & Safety Architecture

1. **Strict Bounded Execution (Zero AI Hallucinations for Money Actions):**
   - Groq AI (Llama 3.3 70B) is **strictly restricted to Root Cause Diagnosis** using forced JSON schemas.
   - All recovery actions, retry delays, and customer communications are governed by a **100% deterministic TypeScript Policy Engine**. The LLM has zero authority to create orders or move money.
2. **Measurable Lift over Baseline:**
   - Evaluates recovered revenue against a naive *"retry everything once"* baseline ($\approx 22\%$).
   - Demonstrates $\approx 35\% - 45\%+$ recovery with zero policy violations and compliant stopping rules.
3. **Immutable Audit Ledger:**
   - Every single decision from ingestion to recovery is recorded with step name, action, timestamp, policy rule triggered, and actor signature.
4. **Emergency Global Kill Switch:**
   - Instantly halts all active recovery operations, pauses batch runners, and safely parks incoming transactions as `HALTED`.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack, Server Actions / API Routes) + TypeScript
- **Styling:** Tailwind CSS + custom Fintech Dark Theme (`#0B0F19`)
- **Database & State:** Supabase (PostgreSQL tables + RLS + Triggers) with in-memory zero-config offline fallback
- **Payments:** Official Razorpay Node.js SDK (Test Mode only – keys starting with `rzp_test_`)
- **AI Classification:** Groq SDK (Llama 3.3 70B Versatile) with forced JSON response formatting

---

## ⚙️ Setup & Configuration

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd Revyn
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root (see `.env.example`):

```env
# 1. Supabase PostgreSQL & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 2. Razorpay API Keys (TEST MODE ONLY - starts with rzp_test_)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx

# 3. Groq AI API Key (Diagnosis only)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# 4. App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** Revyn includes a built-in hybrid mode. If you run the app before configuring external keys, it automatically runs in zero-config demo mode with full simulation!

### 3. Database Setup (Supabase SQL)

If using Supabase, navigate to the **SQL Editor** in your Supabase dashboard and run the contents of [`setup.sql`](./setup.sql). This will create:
- `payment_cases`: Table storing all payment cases, error codes, root causes, policy decisions, and statuses.
- `audit_logs`: Immutable ledger recording every event and reason.
- `app_settings`: Global settings including the emergency kill switch state.

---

## 🏃 How to Run Locally

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To create a production build:

```bash
npm run build
npm run start
```

---

## 🎬 How to Demo Revyn (For Judges)

1. **Launch Dashboard (`/`):**
   - Notice the big metric cards: **Total Revenue at Risk**, **Recovered Revenue**, **Recovery Rate** (with measured lift vs baseline), and **Policy & Safety Stops**.
2. **Execute a Synthetic Recovery Batch:**
   - Under *Execute Recovery Pipeline*, select a batch size (e.g. 20 cases) and click **Run Batch Recovery**.
   - Watch the agent ingest failures across Indian payment failure modes: *insufficient balance*, *bank timeout*, *mandate revoked*, *expired card*, *UPI downtime*, and *ambiguous gateway errors*.
3. **Inspect a Case Lifecycle:**
   - Click **Inspect** on any case in the table to open the **Lifecycle Drawer**:
     - **Step 1 (Diagnose):** See the root cause label, confidence score, and whether it was classified deterministically or via Groq AI.
     - **Step 2 (Policy Decision):** See the exact hard-coded policy rule triggered (`SMART_RETRY`, `PAYMENT_LINK`, `ECONOMIC_FLOOR`, `HARD_STOP_MANDATE`).
     - **Step 3 (Execution):** See the Razorpay Test Mode Payment Link (`https://rzp.io/i/...`) and the personalized **Hinglish WhatsApp message copy**.
     - Click **Simulate Customer Paid** to test real-time recovery calculation.
4. **Test Graceful Failures & Hard Guardrails:**
   - Look for cases with amount < ₹10 — verified blocked by `ECONOMIC_FLOOR`.
   - Look for cases with `mandate_revoked` — verified blocked by `HARD_STOP_MANDATE` (RBI compliance).
5. **Inspect the Immutable Audit Trail (`/audit`):**
   - Review every timestamped entry. Click any row to inspect the full structured JSON payload and actor signature.
6. **Test the Emergency Kill Switch (`/settings`):**
   - Click **ACTIVATE KILL SWITCH** and confirm.
   - Return to the dashboard and try running a batch — the system immediately refuses execution and marks all cases as `HALTED`.
