-- Migration SQL for your actual data
-- Run this in Supabase SQL Editor after creating the cc_bills table

-- Insert all bills from your data
INSERT INTO cc_bills (family_id, month, card_name, category, due_date, is_emi, monthly_amount, paid_amount, total_amount, payments, last_payment_date)
VALUES 
  -- HSBC Dec-25 (PAID)
  ('37685BUV', 'Dec-25', 'HSBC', 'Credit Card', '31 Jan-26', false, 95493.93, 95493.93, 95493.93, 
   '[{"id":"hsbc-dec25-payment1","date":"2025-12-31","note":"Full payment","amount":95493.93}]'::jsonb, 
   '2025-12-31'),
  
  -- RBL Dec-25 (PAID)
  ('37685BUV', 'Dec-25', 'RBL', 'Credit Card', '9 Jan-26', false, 22748, 22748, 22748,
   '[{"id":"rbl-dec25-payment1","date":"2026-01-09","note":"Full payment","amount":22748}]'::jsonb,
   '2026-01-09'),
  
  -- AXIS Dec-25 (PAID)
  ('37685BUV', 'Dec-25', 'AXIS', 'Credit Card', '2 Jan-26', false, 188798.81, 188798.81, 188798.81,
   '[{"id":"axis-dec25-payment1","date":"2026-01-02","note":"Full payment","amount":188798.81}]'::jsonb,
   '2026-01-02'),
  
  -- ICICI Dec-25 (PARTIALLY PAID)
  ('37685BUV', 'Dec-25', 'ICICI', 'Credit Card', '16 Jan-26', false, 146550, 103500, 146550,
   '[{"id":"icici-dec25-payment1","date":"2026-01-05","note":"Partial payment","amount":8000},{"id":"1767696996225","date":"2026-01-06","note":"Partially Paid","amount":95500}]'::jsonb,
   '2026-01-06'),
  
  -- SBI Dec-25 (UNPAID)
  ('37685BUV', 'Dec-25', 'SBI', 'Credit Card', '21 Jan-26', false, 185183, 0, 185183,
   '[]'::jsonb,
   ''),
  
  -- AU Jan-26 (Empty default)
  ('37685BUV', 'Jan-26', 'AU', 'Banking', '15 Feb-26', false, 0, 0, 0,
   '[]'::jsonb,
   ''),
  
  -- AU Dec-25 (Empty default)
  ('37685BUV', 'Dec-25', 'AU', 'Banking', '15 Jan-26', false, 0, 0, 0,
   '[]'::jsonb,
   ''),
  
  -- HSBC Nov-25 (Empty default)
  ('37685BUV', 'Nov-25', 'HSBC', 'Banking', '31 Dec-25', false, 0, 0, 0,
   '[]'::jsonb,
   ''),
  
  -- RBL Nov-25 (Empty default)
  ('37685BUV', 'Nov-25', 'RBL', 'Banking', '9 Dec-25', false, 0, 0, 0,
   '[]'::jsonb,
   ''),
  
  -- AXIS Nov-25 (Empty default)
  ('37685BUV', 'Nov-25', 'AXIS', 'Banking', '2 Dec-25', false, 0, 0, 0,
   '[]'::jsonb,
   ''),
  
  -- ICICI Nov-25 (Empty default)
  ('37685BUV', 'Nov-25', 'ICICI', 'Banking', '16 Dec-25', false, 0, 0, 0,
   '[]'::jsonb,
   ''),
  
  -- SBI Nov-25 (Empty default)
  ('37685BUV', 'Nov-25', 'SBI', 'Banking', '21 Dec-25', false, 0, 0, 0,
   '[]'::jsonb,
   ''),
  
  -- AU Nov-25 (Empty default)
  ('37685BUV', 'Nov-25', 'AU', 'Banking', '15 Dec-25', false, 0, 0, 0,
   '[]'::jsonb,
   '');

-- Verify the migration
SELECT 
  month,
  card_name,
  category,
  monthly_amount,
  paid_amount,
  CASE 
    WHEN paid_amount >= monthly_amount THEN '✓ PAID'
    WHEN paid_amount > 0 THEN '⚠ PARTIAL'
    ELSE '✗ UNPAID'
  END as status
FROM cc_bills
WHERE family_id = '37685BUV'
ORDER BY month DESC, card_name;

-- Check total counts
SELECT 
  month,
  COUNT(*) as bill_count,
  SUM(monthly_amount) as total_due,
  SUM(paid_amount) as total_paid
FROM cc_bills
WHERE family_id = '37685BUV'
GROUP BY month
ORDER BY month DESC;
