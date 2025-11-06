-- Migration: Add payment enhancements columns
-- Description: Adds new columns to support multiple payment methods and technical committee review

-- Add payment_method_id column (nullable first, then we'll make it required after backfill)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method_id INTEGER REFERENCES payment_methods(id);

-- Add reference_number column for payment tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_number VARCHAR;

-- Add account_details column for additional payment information
ALTER TABLE payments ADD COLUMN IF NOT EXISTS account_details TEXT;

-- Add technical committee review fields
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reviewed_by_technical_id INTEGER REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS technical_review_notes TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS technical_reviewed_at TIMESTAMP;

-- For existing payments, set payment_method_id to the first available payment method
-- This is a safe default that won't break the system
UPDATE payments SET payment_method_id = (SELECT id FROM payment_methods ORDER BY id ASC LIMIT 1) WHERE payment_method_id IS NULL;

-- Now make payment_method_id NOT NULL since all existing records have been backfilled
ALTER TABLE payments ALTER COLUMN payment_method_id SET NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payments_reviewed_by_technical_id ON payments(reviewed_by_technical_id);
