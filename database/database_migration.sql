-- ============================================
-- Database Reliability & Performance Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Add Indexes for Better Query Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cc_bills_family_month ON cc_bills(family_id, month);
CREATE INDEX IF NOT EXISTS idx_cc_bills_card_name ON cc_bills(family_id, card_name);
CREATE INDEX IF NOT EXISTS idx_medical_family_date ON medical(family_id, date);
CREATE INDEX IF NOT EXISTS idx_home_family_date ON home(family_id, date);
CREATE INDEX IF NOT EXISTS idx_income_family_month ON income(family_id, month);
CREATE INDEX IF NOT EXISTS idx_cc_limits_family ON cc_limits(family_id, card_name);

-- Composite indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_medical_spender_date ON medical(family_id, spender, date);
CREATE INDEX IF NOT EXISTS idx_home_spender_date ON home(family_id, spender, date);

-- STEP 2: Add Savings Table (if not exists)
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_savings_family_month ON savings(family_id, month);

-- STEP 3: Add Timestamps to Existing Tables
-- ============================================
ALTER TABLE cc_bills 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE medical 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE home 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE income 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE cc_limits 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- STEP 4: Create Auto-Update Trigger
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

-- STEP 5: Create Useful Views
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

-- STEP 6: Create Backup Function
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

-- STEP 7: Create Monthly Summary Function
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

-- STEP 8: Add Data Validation
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
-- VERIFICATION QUERIES
-- ============================================

-- Check indexes created
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('cc_bills', 'medical', 'home', 'income', 'savings', 'cc_limits')
ORDER BY tablename, indexname;

-- Check columns added
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('cc_bills', 'medical', 'home', 'income', 'savings', 'cc_limits')
  AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name;

-- Check views created
SELECT 
  table_name, 
  view_definition 
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name LIKE 'v_%';

-- Check functions created
SELECT 
  routine_name, 
  routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('backup_family_data', 'get_monthly_summary', 'update_updated_at_column', 'check_payment_amount');

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Get monthly summary
-- SELECT * FROM get_monthly_summary('37685BUV', 'Jan-26');

-- Example 2: Backup all data
-- SELECT backup_family_data('37685BUV');

-- Example 3: Query monthly summary view
-- SELECT * FROM v_monthly_summary WHERE family_id = '37685BUV' ORDER BY month DESC LIMIT 6;

-- Example 4: Query expense breakdown
-- SELECT * FROM v_expense_by_spender WHERE family_id = '37685BUV' ORDER BY month DESC, spender;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- Uncomment below to remove all changes (BE CAREFUL!)
/*
DROP TRIGGER IF EXISTS update_cc_bills_updated_at ON cc_bills;
DROP TRIGGER IF EXISTS update_medical_updated_at ON medical;
DROP TRIGGER IF EXISTS update_home_updated_at ON home;
DROP TRIGGER IF EXISTS update_income_updated_at ON income;
DROP TRIGGER IF EXISTS update_savings_updated_at ON savings;
DROP TRIGGER IF EXISTS update_cc_limits_updated_at ON cc_limits;
DROP TRIGGER IF EXISTS validate_payment_before_insert_update ON cc_bills;

DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS check_payment_amount();
DROP FUNCTION IF EXISTS backup_family_data(TEXT);
DROP FUNCTION IF EXISTS get_monthly_summary(TEXT, TEXT);

DROP VIEW IF EXISTS v_monthly_summary;
DROP VIEW IF EXISTS v_expense_by_spender;

-- Don't drop indexes or columns as they don't harm and improve performance
*/
