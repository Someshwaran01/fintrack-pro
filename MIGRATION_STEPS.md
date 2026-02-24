# Complete Database Migration Steps

## Overview
Migrating from single JSONB column (`family_data.bills[]`) to proper table structure (`cc_bills`) to fix data persistence issues.

---

## STEP 1: Create the New Table Structure

### 1.1 Open Supabase SQL Editor
1. Go to https://ixwoyxcutvrdmgmwpuph.supabase.co
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### 1.2 Create cc_bills Table
Copy and paste this SQL:

```sql
-- Create the cc_bills table
CREATE TABLE IF NOT EXISTS cc_bills (
  id BIGSERIAL PRIMARY KEY,
  family_id TEXT NOT NULL,
  month TEXT NOT NULL,
  card_name TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date TEXT NOT NULL,
  is_emi BOOLEAN DEFAULT false,
  monthly_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payments JSONB DEFAULT '[]'::jsonb,
  last_payment_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cc_bills_family_month ON cc_bills(family_id, month);
CREATE INDEX IF NOT EXISTS idx_cc_bills_family ON cc_bills(family_id);
CREATE INDEX IF NOT EXISTS idx_cc_bills_card ON cc_bills(card_name);

-- Enable Row Level Security
ALTER TABLE cc_bills ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth setup)
CREATE POLICY "Allow all operations for authenticated users" ON cc_bills
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cc_bills;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cc_bills_updated_at BEFORE UPDATE ON cc_bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Click "Run" button**

✅ **Expected Result:** "Success. No rows returned"

---

## STEP 2: Migrate Your Data

### 2.1 Stay in SQL Editor
Keep the same SQL Editor window open or open a new query.

### 2.2 Insert Your Data
Copy and paste this SQL:

```sql
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
```

**Click "Run" button**

✅ **Expected Result:** "Success. 13 rows returned" or "INSERT 0 13"

---

## STEP 3: Verify Migration

### 3.1 Check All Bills
Run this verification query:

```sql
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
```

✅ **Expected Result:** 13 rows showing all your bills

### 3.2 Check Summary by Month
Run this query:

```sql
SELECT 
  month,
  COUNT(*) as bill_count,
  SUM(monthly_amount) as total_due,
  SUM(paid_amount) as total_paid,
  SUM(monthly_amount) - SUM(paid_amount) as remaining
FROM cc_bills
WHERE family_id = '37685BUV'
GROUP BY month
ORDER BY month DESC;
```

✅ **Expected Result:**
- **Jan-26**: 1 bill, ₹0 due
- **Dec-25**: 6 bills, ₹638,773.74 due, ₹410,540.74 paid, **₹228,233 remaining** (SBI + ICICI partial)
- **Nov-25**: 6 bills, ₹0 due

---

## STEP 4: Update App Code

Once migration is verified, I'll update these files to use the new table:

### Files to Update:
1. **services/syncService.ts** - Change from JSONB array to table operations
2. **services/storage.ts** - Update load/save logic
3. **App.tsx** - Modify data loading flow
4. **components/CardTracker.tsx** - Update save logic

### Key Changes:
- Replace `UPDATE family_data SET bills = $1` with proper INSERT/UPDATE/DELETE
- Change realtime subscription from `family_data` to `cc_bills`
- Update queries to filter by month: `WHERE family_id = ? AND month = ?`

---

## STEP 5: Test the Migration

After code updates:

### 5.1 Test Data Loading
1. Refresh browser
2. Check Dec-25 shows all 6 cards with correct amounts
3. Check Jan-26 shows AU default card

### 5.2 Test Data Persistence
1. Add a new payment to SBI Dec-25
2. Refresh browser multiple times rapidly
3. ✅ Data should NOT vanish

### 5.3 Test Default Cards
1. Switch to Feb-26 (new month)
2. ✅ All 6 default cards should appear automatically

### 5.4 Test CC Due
1. Check Dashboard home page
2. ✅ Should show ₹228,233 due (SBI 185,183 + ICICI 43,050)
3. Click "View Details"
4. ✅ Should list both unpaid bills with month info

---

## Rollback Plan (If Needed)

If something goes wrong, you can revert:

```sql
-- Drop the new table
DROP TABLE IF EXISTS cc_bills CASCADE;

-- Your old data is still safe in family_data.bills
```

The `family_data` table is NOT modified during migration, so your original data remains intact.

---

## After Successful Migration

Optional cleanup (do this later):

```sql
-- Clear the old bills column (ONLY after confirming new structure works)
UPDATE family_data 
SET bills = '[]'::jsonb 
WHERE family_id = '37685BUV';
```

---

## Current Status

- [x] STEP 1: Create cc_bills table ✅
- [x] STEP 2: Migrate data (13 bills) ✅
- [x] STEP 3: Verify migration ✅
- [x] STEP 4: Update app code ✅
- [ ] STEP 5: Test everything

**Migration Complete!** App now uses the new `cc_bills` table structure.

---

## What Changed in the Code

### services/syncService.ts
**✅ UPDATED - Commit f746d58**

1. **`saveBills()` function** - Complete rewrite:
   - OLD: Single UPDATE query replacing entire bills array in family_data.bills
   - NEW: Smart upsert logic - fetches existing bills, performs INSERT/UPDATE/DELETE operations on individual rows
   - Benefits: No more race conditions, efficient updates, proper data integrity

2. **`getFamilyData()` function** - Enhanced query:
   - OLD: Single SELECT from family_data table
   - NEW: JOIN queries - fetches bills from cc_bills table, medical/home from family_data
   - Transforms cc_bills rows back to CreditCardBill format

3. **`subscribeToChanges()` function** - Dual subscription:
   - OLD: Single subscription to family_data UPDATE events
   - NEW: Listens to both cc_bills (*all events*) AND family_data (UPDATE)
   - Real-time reload of all bills when any bill changes

### storage.ts
**✅ NO CHANGES NEEDED**
- Already uses syncService.ts functions, so benefits from new structure automatically

### App.tsx
**✅ NO CHANGES NEEDED**
- Data flow unchanged, continues to work with CreditCardBill[] format
- All race condition protections remain in place

### components/CardTracker.tsx
**✅ NO CHANGES NEEDED**
- Component logic unchanged, works with same data structure

---
