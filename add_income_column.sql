-- Migration: Add income column to family_data table
-- This migration adds support for tracking monthly income

-- Add income column to family_data table if it doesn't exist
ALTER TABLE family_data 
ADD COLUMN IF NOT EXISTS income JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN family_data.income IS 'Array of income entries with monthly tracking';

-- Example of income structure:
-- [
--   {
--     "id": "1704700800000",
--     "month": "Jan-26",
--     "source": "Salary",
--     "amount": 50000,
--     "receivedDate": "2026-01-05",
--     "spender": "Somu",
--     "notes": "Monthly salary"
--   }
-- ]
