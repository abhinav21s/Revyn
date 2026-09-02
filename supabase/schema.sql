-- ============================================================
-- Revyn – Database Schema (Supabase PostgreSQL)
-- Track 03: AI Revenue Recovery (Razorpay AI Buildathon 2026)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PAYMENT CASES TABLE
CREATE TABLE IF NOT EXISTS payment_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    amount BIGINT NOT NULL, -- in paise
    currency TEXT NOT NULL DEFAULT 'INR',
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    root_cause TEXT,
    diagnosis_confidence NUMERIC(4, 3),
    diagnosis_method TEXT CHECK (diagnosis_method IN ('rule_based', 'llm_groq')),
    diagnosis_explanation TEXT,
    policy_action TEXT,
    policy_reason TEXT,
    policy_rule TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'recovered', 'failed', 'escalated', 'unrecoverable', 'halted')),
    retry_count INT NOT NULL DEFAULT 0,
    payment_link_url TEXT,
    payment_link_id TEXT,
    recovered_amount BIGINT,
    recovered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_cases_status ON payment_cases(status);
CREATE INDEX IF NOT EXISTS idx_payment_cases_created ON payment_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_cases_link ON payment_cases(payment_link_id);

-- 2. IMMUTABLE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id TEXT NOT NULL,
    step TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT NOT NULL,
    policy_rule TEXT,
    actor TEXT NOT NULL DEFAULT 'revyn-agent',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_case ON audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_step ON audit_logs(step);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 3. APP SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value, updated_at)
VALUES 
    ('kill_switch', 'false', NOW()),
    ('max_retries', '3', NOW()),
    ('economic_floor_paise', '1000', NOW())
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payment_cases_updated_at ON payment_cases;
CREATE TRIGGER update_payment_cases_updated_at
    BEFORE UPDATE ON payment_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
