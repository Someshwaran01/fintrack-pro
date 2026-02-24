-- Add missing default cards for Jan-26
-- Run this in Supabase SQL Editor

INSERT INTO cc_bills (family_id, month, card_name, category, due_date, is_emi, monthly_amount, paid_amount, total_amount, payments, last_payment_date)
VALUES 
  -- HSBC Jan-26 (Empty default)
  ('37685BUV', 'Jan-26', 'HSBC', 'Banking', '31 Feb-26', false, 0, 0, 0, '[]'::jsonb, ''),
  
  -- RBL Jan-26 (Empty default)
  ('37685BUV', 'Jan-26', 'RBL', 'Banking', '9 Feb-26', false, 0, 0, 0, '[]'::jsonb, ''),
  
  -- AXIS Jan-26 (Empty default)
  ('37685BUV', 'Jan-26', 'AXIS', 'Banking', '2 Feb-26', false, 0, 0, 0, '[]'::jsonb, ''),
  
  -- ICICI Jan-26 (Empty default)
  ('37685BUV', 'Jan-26', 'ICICI', 'Banking', '16 Feb-26', false, 0, 0, 0, '[]'::jsonb, ''),
  
  -- SBI Jan-26 (Empty default)
  ('37685BUV', 'Jan-26', 'SBI', 'Banking', '21 Feb-26', false, 0, 0, 0, '[]'::jsonb, '');

-- Verify the cards were added
SELECT month, card_name, category, monthly_amount, due_date
FROM cc_bills
WHERE family_id = '37685BUV' AND month = 'Jan-26'
ORDER BY card_name;
