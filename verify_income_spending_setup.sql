-- Verification Script: Income vs Spending Tracker Setup
-- This script verifies that all necessary columns exist for the Income vs Spending feature
-- No changes are made to existing functionality

-- 1. Verify income column exists in family_data table
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'family_data'
    AND column_name = 'income'
) AS income_column_exists;

-- 2. Verify medical column exists (for UPI spending tracking)
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'family_data'
    AND column_name = 'medical'
) AS medical_column_exists;

-- 3. Verify home column exists (for UPI spending tracking)
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'family_data'
    AND column_name = 'home'
) AS home_column_exists;

-- 4. Optional: View current structure of family_data table
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'family_data'
ORDER BY ordinal_position;

-- 5. Optional: Sample query to test income vs spending calculation
-- This query demonstrates how the app calculates the values displayed on the dashboard
-- Replace 'your-family-id' with your actual family ID and 'Jan-26' with the desired month

/*
WITH family_record AS (
    SELECT 
        income,
        medical,
        home
    FROM family_data
    WHERE family_id = 'your-family-id'
)
SELECT 
    -- Total Income for the month
    (SELECT COALESCE(SUM((income_item->>'amount')::numeric), 0)
     FROM family_record, jsonb_array_elements(income) AS income_item
     WHERE income_item->>'month' = 'Jan-26') AS total_income,
    
    -- UPI Spending from Medical expenses
    (SELECT COALESCE(SUM((medical_item->>'amount')::numeric), 0)
     FROM family_record, jsonb_array_elements(medical) AS medical_item
     WHERE medical_item->>'paymentMethod' = 'UPI'
     AND TO_CHAR(TO_DATE(medical_item->>'date', 'YYYY-MM-DD'), 'Mon-YY') = 'Jan-26') AS medical_upi_spending,
    
    -- UPI Spending from Home expenses
    (SELECT COALESCE(SUM((home_item->>'amount')::numeric), 0)
     FROM family_record, jsonb_array_elements(home) AS home_item
     WHERE home_item->>'paymentMethod' = 'UPI'
     AND TO_CHAR(TO_DATE(home_item->>'date', 'YYYY-MM-DD'), 'Mon-YY') = 'Jan-26') AS home_upi_spending;
*/

-- Notes:
-- - The income column stores income entries as JSONB array
-- - Medical and home columns store expenses with paymentMethod field
-- - UPI spending is calculated by filtering expenses where paymentMethod = 'UPI'
-- - The dashboard shows: Total Income - UPI Spending = Remaining Balance
-- - This feature does not affect existing functionality
