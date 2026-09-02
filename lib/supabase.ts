import { createClient } from "@supabase/supabase-js";
import type { PaymentCase, AuditLog } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project") &&
    supabaseUrl.startsWith("http")
);

// In-memory mock storage fallback for instant zero-config testing & offline demo
class MockStore {
  private cases: PaymentCase[] = [];
  private auditLogs: AuditLog[] = [];
  private settings: Record<string, string> = {
    kill_switch: "false",
    max_retries: "3",
    economic_floor_paise: "1000",
  };

  constructor() {
    // Seed with a few initial demo cases
    this.cases = [
      {
        id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        merchant_id: "merchant_swiggy_demo",
        customer_name: "Rahul Verma",
        customer_email: "rahul.verma@example.com",
        customer_phone: "+919876543210",
        amount: 49900,
        currency: "INR",
        error_code: "BAD_REQUEST_ERROR_INSUFFICIENT_BALANCE",
        error_message: "Your account balance is insufficient for this transaction",
        root_cause: "insufficient_balance",
        diagnosis_confidence: 0.98,
        diagnosis_method: "rule_based",
        diagnosis_explanation: "Rule-based: Error code maps to insufficient_balance.",
        policy_action: "smart_retry",
        policy_reason: "Root cause is transient. Scheduling smart retry in 24h.",
        policy_rule: "SMART_RETRY",
        status: "in_progress",
        retry_count: 1,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        merchant_id: "merchant_zepto_demo",
        customer_name: "Priya Sharma",
        customer_email: "priya.sharma@example.com",
        customer_phone: "+919123456780",
        amount: 149900,
        currency: "INR",
        error_code: "GATEWAY_ERROR_TIMEOUT",
        error_message: "Bank server did not respond within the allowed time",
        root_cause: "bank_timeout",
        diagnosis_confidence: 0.95,
        diagnosis_method: "rule_based",
        diagnosis_explanation: "Rule-based: Bank timeout detected.",
        policy_action: "send_payment_link",
        policy_reason: "Customer action requested. Created payment link.",
        policy_rule: "PAYMENT_LINK",
        status: "recovered",
        retry_count: 1,
        payment_link_url: "https://rzp.io/i/test_recov_987",
        payment_link_id: "plink_test_987",
        recovered_amount: 149900,
        recovered_at: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
        merchant_id: "merchant_blinkit_demo",
        customer_name: "Vikram Patel",
        customer_email: "vikram.patel@example.com",
        customer_phone: "+919988776655",
        amount: 800, // ₹8 (below economic floor)
        currency: "INR",
        error_code: "BAD_REQUEST_ERROR_INSUFFICIENT_BALANCE",
        error_message: "Low account balance",
        root_cause: "insufficient_balance",
        diagnosis_confidence: 0.98,
        diagnosis_method: "rule_based",
        diagnosis_explanation: "Low account balance.",
        policy_action: "mark_unrecoverable",
        policy_reason: "Amount ₹8.00 is below economic floor of ₹10.00.",
        policy_rule: "ECONOMIC_FLOOR",
        status: "unrecoverable",
        retry_count: 0,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
        merchant_id: "merchant_meesho_demo",
        customer_name: "Anjali Singh",
        customer_email: "anjali.singh@example.com",
        customer_phone: "+919811223344",
        amount: 99900,
        currency: "INR",
        error_code: "BAD_REQUEST_EMANDATE_REVOKED",
        error_message: "UPI Autopay mandate has been revoked by the customer",
        root_cause: "mandate_revoked",
        diagnosis_confidence: 0.99,
        diagnosis_method: "rule_based",
        diagnosis_explanation: "Mandate revoked by user.",
        policy_action: "mark_unrecoverable",
        policy_reason: "Mandate revoked. Retrying would violate RBI mandate rules.",
        policy_rule: "HARD_STOP_MANDATE",
        status: "unrecoverable",
        retry_count: 0,
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.auditLogs = [
      {
        id: "log-1",
        case_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        step: "RECOVERED",
        action: "payment_link_paid",
        reason: "Payment link paid via Razorpay webhook. Amount: ₹1499.00. Revenue recovered!",
        policy_rule: "WEBHOOK_RECOVERY",
        actor: "razorpay-webhook",
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: "log-2",
        case_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        step: "EXECUTE",
        action: "payment_link_created",
        reason: "Razorpay payment link created: https://rzp.io/i/test_recov_987",
        policy_rule: "PAYMENT_LINK",
        actor: "razorpay-api",
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "log-3",
        case_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        step: "DECIDE",
        action: "smart_retry",
        reason: "Root cause is transient. Scheduling smart retry in 24h.",
        policy_rule: "SMART_RETRY",
        actor: "policy-engine",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];
  }

  from(table: string) {
    const self = this;
    return {
      select(columns = "*", options?: { count?: "exact" }) {
        let currentData: any[] = [];
        if (table === "payment_cases") currentData = [...self.cases];
        else if (table === "audit_logs") currentData = [...self.auditLogs];
        else if (table === "app_settings")
          currentData = Object.entries(self.settings).map(([k, v]) => ({
            key: k,
            value: v,
          }));

        const queryObj: any = {
          _data: currentData,
          _count: currentData.length,
          order(col: string, { ascending = true }: { ascending?: boolean } = {}) {
            queryObj._data.sort((a: any, b: any) => {
              if (a[col] < b[col]) return ascending ? -1 : 1;
              if (a[col] > b[col]) return ascending ? 1 : -1;
              return 0;
            });
            return queryObj;
          },
          range(from: number, to: number) {
            queryObj._data = queryObj._data.slice(from, to + 1);
            return queryObj;
          },
          eq(col: string, val: any) {
            queryObj._data = queryObj._data.filter((item: any) => item[col] === val);
            queryObj._count = queryObj._data.length;
            return queryObj;
          },
          neq(col: string, val: any) {
            queryObj._data = queryObj._data.filter((item: any) => item[col] !== val);
            queryObj._count = queryObj._data.length;
            return queryObj;
          },
          or(clause: string) {
            // simple match for demo
            return queryObj;
          },
          async single() {
            return { data: queryObj._data[0] || null, error: null };
          },
          then(resolve: any) {
            return resolve({
              data: queryObj._data,
              error: null,
              count: queryObj._count,
            });
          },
        };
        return queryObj;
      },
      insert(rows: any | any[]) {
        const rowArray = Array.isArray(rows) ? rows : [rows];
        const newRows = rowArray.map((r) => ({
          id: r.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...r,
        }));

        if (table === "payment_cases") {
          self.cases.unshift(...newRows);
        } else if (table === "audit_logs") {
          self.auditLogs.unshift(...newRows);
        }

        return {
          select() {
            return {
              then(resolve: any) {
                resolve({ data: newRows, error: null });
              },
            };
          },
          then(resolve: any) {
            resolve({ data: newRows, error: null });
          },
        };
      },
      update(updates: any) {
        let filterCol = "";
        let filterVal: any = null;
        const updateObj = {
          eq(col: string, val: any) {
            filterCol = col;
            filterVal = val;
            if (table === "payment_cases") {
              self.cases = self.cases.map((c) =>
                (c as any)[filterCol] === filterVal
                  ? { ...c, ...updates, updated_at: new Date().toISOString() }
                  : c
              );
            }
            return updateObj;
          },
          then(resolve: any) {
            resolve({ data: updates, error: null });
          },
        };
        return updateObj;
      },
      upsert(record: { key: string; value: string }) {
        if (table === "app_settings") {
          self.settings[record.key] = record.value;
        }
        return {
          then(resolve: any) {
            resolve({ data: record, error: null });
          },
        };
      },
      delete() {
        return {
          neq(col: string, val: any) {
            if (table === "payment_cases") self.cases = [];
            if (table === "audit_logs") self.auditLogs = [];
            return {
              then(resolve: any) {
                resolve({ data: null, error: null });
              },
            };
          },
        };
      },
    };
  }
}

const mockStore = new MockStore();

// Real Supabase client if configured, otherwise fallback mock store
export const supabaseAdmin: any = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey || supabaseAnonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : mockStore;

export const supabase: any = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : mockStore;
