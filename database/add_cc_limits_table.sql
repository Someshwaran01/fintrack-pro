-- Migration: Add credit card limits table
-- This migration creates a separate table for storing credit card limits
-- Credit card limits are fixed across all months and can be updated when banks change limits

-- Create cc_limits table
CREATE TABLE IF NOT EXISTS cc_limits (
    id BIGSERIAL PRIMARY KEY,
    family_id TEXT NOT NULL,
    card_name TEXT NOT NULL,
    credit_limit NUMERIC NOT NULL,
    updated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(family_id, card_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cc_limits_family_id ON cc_limits(family_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE cc_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Enable all operations for all users" ON cc_limits
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment to document the table
COMMENT ON TABLE cc_limits IS 'Stores credit card limits that are fixed across all months';
COMMENT ON COLUMN cc_limits.family_id IS 'Family ID for multi-user sync';
COMMENT ON COLUMN cc_limits.card_name IS 'Name of the credit card (e.g., HDFC Regalia)';
COMMENT ON COLUMN cc_limits.credit_limit IS 'Credit limit amount in rupees';
COMMENT ON COLUMN cc_limits.updated_date IS 'Date when the limit was last updated';
COMMENT ON COLUMN cc_limits.notes IS 'Optional notes about limit changes';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cc_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER cc_limits_updated_at_trigger
    BEFORE UPDATE ON cc_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_cc_limits_updated_at();

-- Example data structure:
-- family_id: 'abc123'
-- card_name: 'HDFC Regalia'
-- credit_limit: 500000
-- updated_date: '2026-01-08'
-- notes: 'Increased limit on Dec 2025'

-- Verification query: Check if table was created successfully
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cc_limits'
ORDER BY ordinal_position;
