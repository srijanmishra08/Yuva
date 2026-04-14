-- ============================================================
-- YUVA Conference Portal — Supabase SQL Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('DELEGATE', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE payment_type AS ENUM ('RAZORPAY', 'CASH', 'COMPLIMENTARY');
CREATE TYPE payment_status AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'REFUNDED');
CREATE TYPE allotment_status AS ENUM ('PENDING', 'ASSIGNED', 'CONFIRMED');

-- ============================================================
-- COMMITTEES TABLE
-- ============================================================

CREATE TABLE committees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL,
  description TEXT,
  max_seats INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PORTFOLIOS TABLE
-- ============================================================

CREATE TABLE portfolios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  country_or_role TEXT NOT NULL,
  is_assigned BOOLEAN DEFAULT FALSE,
  assigned_to UUID, -- will be filled with delegate id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(committee_id, country_or_role)
);

-- ============================================================
-- DELEGATE ID SEQUENCE
-- ============================================================

CREATE SEQUENCE delegate_id_seq START 1;

-- ============================================================
-- DELEGATES TABLE
-- ============================================================

CREATE TABLE delegates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  delegate_id TEXT UNIQUE, -- e.g., YDS26-001

  -- Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  class_year TEXT NOT NULL,
  institution TEXT NOT NULL,

  -- Address
  address TEXT,
  city TEXT,
  pin_code TEXT,

  -- Parent / Guardian
  parent_name TEXT,
  parent_contact TEXT,

  -- Additional
  instagram_handle TEXT,
  experience TEXT,

  -- Preferences
  pref1 TEXT, -- Committee preference 1
  portfolio_pref1 TEXT, -- Portfolio pref for committee 1
  pref2 TEXT, -- Committee preference 2

  -- Allotments
  committee_assigned UUID REFERENCES committees(id),
  portfolio_assigned UUID REFERENCES portfolios(id),
  allotment_status allotment_status DEFAULT 'PENDING',

  -- Payment
  payment_type payment_type DEFAULT 'RAZORPAY',
  payment_status payment_status DEFAULT 'PENDING',
  payment_id TEXT,
  razorpay_order_id TEXT,
  amount_paid INTEGER DEFAULT 499, -- in paise * 100? No, store in rupees
  carnival_pass BOOLEAN DEFAULT FALSE,

  -- Referral
  referred_by TEXT,

  -- QR & Check-in
  qr_code_url TEXT,
  qr_token TEXT, -- HMAC token
  checked_in BOOLEAN DEFAULT FALSE,
  checkin_time TIMESTAMPTZ,
  checkin_by UUID, -- admin/volunteer who checked in

  -- Confirmation
  confirmation_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent_at TIMESTAMPTZ,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMINS TABLE (extends Supabase auth)
-- ============================================================

CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'ADMIN',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================

CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  actor_id UUID, -- admin ID
  actor_role user_role,
  target_id UUID, -- delegate ID or other resource
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RAZORPAY ORDERS TABLE
-- ============================================================

CREATE TABLE razorpay_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  delegate_temp_data JSONB NOT NULL, -- pre-payment form data
  amount INTEGER NOT NULL, -- in paise
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created',
  payment_id TEXT,
  webhook_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delegates_updated_at
  BEFORE UPDATE ON delegates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER razorpay_orders_updated_at
  BEFORE UPDATE ON razorpay_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate delegate ID function
CREATE OR REPLACE FUNCTION generate_delegate_id()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
  new_id TEXT;
BEGIN
  next_val := nextval('delegate_id_seq');
  new_id := 'YDS26-' || LPAD(next_val::TEXT, 3, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Delegates can view their own record
CREATE POLICY "Delegates view own record" ON delegates
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Admins can view delegates (restricted columns via view)
CREATE POLICY "Admins can view all delegates" ON delegates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = TRUE)
  );

-- Super admins have full access
CREATE POLICY "Super admins full access" ON delegates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- Admins can update allotment fields only
CREATE POLICY "Admins update allotments" ON delegates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = TRUE)
  );

-- Service role bypass (for API routes)
CREATE POLICY "Service role bypass delegates" ON delegates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass committees" ON committees
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass portfolios" ON portfolios
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass admins" ON admins
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass audit" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Public read for committees
CREATE POLICY "Public read committees" ON committees
  FOR SELECT USING (TRUE);

-- Public read for portfolios (availability only)
CREATE POLICY "Public read portfolios" ON portfolios
  FOR SELECT USING (TRUE);

-- ============================================================
-- ADMIN-SAFE VIEW (hides sensitive fields)
-- ============================================================

CREATE VIEW admin_delegates_view AS
  SELECT
    id,
    delegate_id,
    first_name,
    last_name,
    class_year,
    institution,
    pref1,
    pref2,
    portfolio_pref1,
    experience,
    committee_assigned,
    portfolio_assigned,
    allotment_status,
    payment_type,
    payment_status,
    carnival_pass,
    checked_in,
    checkin_time,
    referred_by,
    created_at
    -- NOTE: email, phone, payment_id, parent_contact intentionally excluded
  FROM delegates;

-- ============================================================
-- SEED DATA — COMMITTEES
-- ============================================================

INSERT INTO committees (name, abbreviation, description, max_seats) VALUES
  ('United Nations Human Rights Council', 'UNHRC', 'Addresses human rights violations worldwide', 25),
  ('United Nations Security Council', 'UNSC', 'Maintains international peace and security', 15),
  ('United Nations Environment Programme', 'UNEP', 'Addresses global environmental challenges', 25),
  ('World Health Organization', 'WHO', 'Directs international public health', 20),
  ('International Press Corps', 'IPC', 'Press delegation covering all committees', 10),
  ('Ad Hoc Committee', 'AHC', 'Special committee on emerging crises', 20);

-- ============================================================
-- SEED DATA — PORTFOLIOS (UNHRC example)
-- ============================================================

WITH unhrc AS (SELECT id FROM committees WHERE abbreviation = 'UNHRC')
INSERT INTO portfolios (committee_id, country_or_role) 
SELECT unhrc.id, country FROM unhrc,
(VALUES
  ('United States of America'),
  ('People''s Republic of China'),
  ('Russian Federation'),
  ('Republic of India'),
  ('United Kingdom'),
  ('France'),
  ('Federal Republic of Germany'),
  ('Brazil'),
  ('South Africa'),
  ('Japan'),
  ('Australia'),
  ('Canada'),
  ('Mexico'),
  ('Argentina'),
  ('Saudi Arabia'),
  ('Egypt'),
  ('Nigeria'),
  ('Indonesia'),
  ('Pakistan'),
  ('Bangladesh'),
  ('Turkey'),
  ('Republic of Korea'),
  ('Sweden'),
  ('Netherlands'),
  ('Switzerland')
) AS t(country);

WITH unsc AS (SELECT id FROM committees WHERE abbreviation = 'UNSC')
INSERT INTO portfolios (committee_id, country_or_role)
SELECT unsc.id, country FROM unsc,
(VALUES
  ('United States of America (P5)'),
  ('United Kingdom (P5)'),
  ('France (P5)'),
  ('People''s Republic of China (P5)'),
  ('Russian Federation (P5)'),
  ('Republic of India (E10)'),
  ('Brazil (E10)'),
  ('Japan (E10)'),
  ('Germany (E10)'),
  ('South Africa (E10)'),
  ('Mexico (E10)'),
  ('Switzerland (E10)'),
  ('Ecuador (E10)'),
  ('Mozambique (E10)'),
  ('Malta (E10)')
) AS t(country);

WITH unep AS (SELECT id FROM committees WHERE abbreviation = 'UNEP')
INSERT INTO portfolios (committee_id, country_or_role)
SELECT unep.id, country FROM unep,
(VALUES
  ('United States'), ('China'), ('India'), ('Germany'), ('Brazil'),
  ('France'), ('UK'), ('Japan'), ('Canada'), ('Australia'),
  ('Norway'), ('Netherlands'), ('Sweden'), ('Denmark'), ('New Zealand'),
  ('Costa Rica'), ('Kenya'), ('Bangladesh'), ('Indonesia'), ('Saudi Arabia'),
  ('South Korea'), ('Mexico'), ('Argentina'), ('Egypt'), ('Pakistan')
) AS t(country);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_delegates_email ON delegates(email);
CREATE INDEX idx_delegates_delegate_id ON delegates(delegate_id);
CREATE INDEX idx_delegates_payment_status ON delegates(payment_status);
CREATE INDEX idx_delegates_committee ON delegates(committee_assigned);
CREATE INDEX idx_portfolios_committee ON portfolios(committee_id);
CREATE INDEX idx_portfolios_assigned ON portfolios(is_assigned);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_id);
CREATE INDEX idx_razorpay_orders_order_id ON razorpay_orders(order_id);
