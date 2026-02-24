-- ============================================
-- Complete Database Schema Setup
-- Run this FIRST if tables don't exist yet
-- ============================================

-- STEP 1: Create all tables
-- ============================================

-- Credit Card Bills Table
CREATE TABLE IF NOT EXISTS cc_bills (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  month TEXT NOT NULL,
  card_name TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date TEXT NOT NULL,
  is_emi BOOLEAN DEFAULT false,
  emi_details TEXT,
  total_amount NUMERIC DEFAULT 0,
  tenure TEXT,
  monthly_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  payments JSONB DEFAULT '[]'::jsonb,
  last_payment_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Expenses Table
CREATE TABLE IF NOT EXISTS medical (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  description TEXT NOT NULL,
  spender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Home Expenses Table
CREATE TABLE IF NOT EXISTS home (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  spender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income Table
CREATE TABLE IF NOT EXISTS income (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  month TEXT NOT NULL,
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  received_date TEXT NOT NULL,
  spender TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings Table
CREATE TABLE IF NOT EXISTS savings (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  month TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  saved_date TEXT NOT NULL,
  spender TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Card Limits Table
CREATE TABLE IF NOT EXISTS cc_limits (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  credit_limit NUMERIC NOT NULL,
  updated_date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy Family Data Table (for backward compatibility)
CREATE TABLE IF NOT EXISTS family_data (
  family_id TEXT PRIMARY KEY,
  bills JSONB DEFAULT '[]'::jsonb,
  medical JSONB DEFAULT '[]'::jsonb,
  home JSONB DEFAULT '[]'::jsonb,
  income JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Create Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cc_bills_family_month ON cc_bills(family_id, month);
CREATE INDEX IF NOT EXISTS idx_cc_bills_card_name ON cc_bills(family_id, card_name);
CREATE INDEX IF NOT EXISTS idx_medical_family_date ON medical(family_id, date);
CREATE INDEX IF NOT EXISTS idx_medical_spender_date ON medical(family_id, spender, date);
CREATE INDEX IF NOT EXISTS idx_home_family_date ON home(family_id, date);
CREATE INDEX IF NOT EXISTS idx_home_spender_date ON home(family_id, spender, date);
CREATE INDEX IF NOT EXISTS idx_income_family_month ON income(family_id, month);
CREATE INDEX IF NOT EXISTS idx_savings_family_month ON savings(family_id, month);
CREATE INDEX IF NOT EXISTS idx_cc_limits_family ON cc_limits(family_id, card_name);

-- STEP 3: Create Auto-Update Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_cc_bills_updated_at ON cc_bills;
CREATE TRIGGER update_cc_bills_updated_at BEFORE UPDATE ON cc_bills 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_updated_at ON medical;
CREATE TRIGGER update_medical_updated_at BEFORE UPDATE ON medical 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_home_updated_at ON home;
CREATE TRIGGER update_home_updated_at BEFORE UPDATE ON home 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_income_updated_at ON income;
CREATE TRIGGER update_income_updated_at BEFORE UPDATE ON income 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_savings_updated_at ON savings;
CREATE TRIGGER update_savings_updated_at BEFORE UPDATE ON savings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cc_limits_updated_at ON cc_limits;
CREATE TRIGGER update_cc_limits_updated_at BEFORE UPDATE ON cc_limits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 4: Create Views
-- ============================================

-- Monthly Summary View
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT 
  family_id,
  month,
  SUM(monthly_amount) as total_due,
  SUM(paid_amount) as total_paid,
  SUM(monthly_amount) - SUM(paid_amount) as outstanding,
  COUNT(*) as bill_count
FROM cc_bills
GROUP BY family_id, month;

-- Expense by Spender View
CREATE OR REPLACE VIEW v_expense_by_spender AS
SELECT 
  family_id,
  spender,
  DATE_TRUNC('month', date::date) as month,
  'Medical' as expense_type,
  SUM(amount) as total_amount
FROM medical
WHERE spender IS NOT NULL
GROUP BY family_id, spender, DATE_TRUNC('month', date::date)
UNION ALL
SELECT 
  family_id,
  spender,
  DATE_TRUNC('month', date::date) as month,
  'Home' as expense_type,
  SUM(amount) as total_amount
FROM home
WHERE spender IS NOT NULL
GROUP BY family_id, spender, DATE_TRUNC('month', date::date);

-- Income vs Expenses View
CREATE OR REPLACE VIEW v_income_vs_expenses AS
WITH monthly_income AS (
  SELECT family_id, month, spender, SUM(amount) as income
  FROM income
  GROUP BY family_id, month, spender
),
monthly_expenses AS (
  SELECT 
    family_id,
    TO_CHAR(date::date, 'Mon-YY') as month,
    spender,
    SUM(amount) as expenses
  FROM (
    SELECT family_id, date, spender, amount FROM medical WHERE spender IS NOT NULL
    UNION ALL
    SELECT family_id, date, spender, amount FROM home WHERE spender IS NOT NULL
  ) all_expenses
  GROUP BY family_id, TO_CHAR(date::date, 'Mon-YY'), spender
)
SELECT 
  COALESCE(i.family_id, e.family_id) as family_id,
  COALESCE(i.month, e.month) as month,
  COALESCE(i.spender, e.spender) as spender,
  COALESCE(i.income, 0) as income,
  COALESCE(e.expenses, 0) as expenses,
  COALESCE(i.income, 0) - COALESCE(e.expenses, 0) as balance
FROM monthly_income i
FULL OUTER JOIN monthly_expenses e 
  ON i.family_id = e.family_id 
  AND i.month = e.month 
  AND i.spender = e.spender;

-- STEP 5: Create Backup Function
-- ============================================
CREATE OR REPLACE FUNCTION backup_family_data(p_family_id TEXT)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'family_id', p_family_id,
    'backup_date', NOW(),
    'bills', (SELECT jsonb_agg(row_to_json(cc_bills.*)) FROM cc_bills WHERE family_id = p_family_id),
    'medical', (SELECT jsonb_agg(row_to_json(medical.*)) FROM medical WHERE family_id = p_family_id),
    'home', (SELECT jsonb_agg(row_to_json(home.*)) FROM home WHERE family_id = p_family_id),
    'income', (SELECT jsonb_agg(row_to_json(income.*)) FROM income WHERE family_id = p_family_id),
    'savings', (SELECT jsonb_agg(row_to_json(savings.*)) FROM savings WHERE family_id = p_family_id),
    'cc_limits', (SELECT jsonb_agg(row_to_json(cc_limits.*)) FROM cc_limits WHERE family_id = p_family_id)
  );
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Create Monthly Summary Function
-- ============================================
CREATE OR REPLACE FUNCTION get_monthly_summary(
  p_family_id TEXT,
  p_month TEXT
)
RETURNS TABLE (
  total_income NUMERIC,
  total_expenses NUMERIC,
  total_savings NUMERIC,
  cc_outstanding NUMERIC,
  net_balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT SUM(amount) FROM income WHERE family_id = p_family_id AND month = p_month), 0) as total_income,
    COALESCE((SELECT SUM(amount) FROM medical WHERE family_id = p_family_id AND TO_CHAR(date::date, 'Mon-YY') = p_month), 0) +
    COALESCE((SELECT SUM(amount) FROM home WHERE family_id = p_family_id AND TO_CHAR(date::date, 'Mon-YY') = p_month), 0) as total_expenses,
    COALESCE((SELECT SUM(amount) FROM savings WHERE family_id = p_family_id AND month = p_month), 0) as total_savings,
    COALESCE((SELECT SUM(monthly_amount - paid_amount) FROM cc_bills WHERE family_id = p_family_id AND month = p_month), 0) as cc_outstanding,
    COALESCE((SELECT SUM(amount) FROM income WHERE family_id = p_family_id AND month = p_month), 0) -
    COALESCE((SELECT SUM(amount) FROM medical WHERE family_id = p_family_id AND TO_CHAR(date::date, 'Mon-YY') = p_month), 0) -
    COALESCE((SELECT SUM(amount) FROM home WHERE family_id = p_family_id AND TO_CHAR(date::date, 'Mon-YY') = p_month), 0) -
    COALESCE((SELECT SUM(amount) FROM savings WHERE family_id = p_family_id AND month = p_month), 0) as net_balance;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Add Data Validation Trigger
-- ============================================
CREATE OR REPLACE FUNCTION check_payment_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount > NEW.monthly_amount THEN
    RAISE EXCEPTION 'Paid amount (%) cannot exceed monthly amount (%)', NEW.paid_amount, NEW.monthly_amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_payment_before_insert_update ON cc_bills;
CREATE TRIGGER validate_payment_before_insert_update
BEFORE INSERT OR UPDATE ON cc_bills
FOR EACH ROW EXECUTE FUNCTION check_payment_amount();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('cc_bills', 'medical', 'home', 'income', 'savings', 'cc_limits', 'family_data')
ORDER BY table_name;

-- Check all indexes exist
SELECT 
  tablename, 
  indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('cc_bills', 'medical', 'home', 'income', 'savings', 'cc_limits')
ORDER BY tablename, indexname;

-- Check all views exist
SELECT 
  table_name
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name LIKE 'v_%';

-- Check all functions exist
SELECT 
  routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('backup_family_data', 'get_monthly_summary', 'update_updated_at_column', 'check_payment_amount');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema setup complete!';
  RAISE NOTICE '✅ All tables, indexes, views, and functions created successfully.';
  RAISE NOTICE '✅ Your app is now ready to use.';
END $$;
