-- Add business verification fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_license_path VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_verification_status VARCHAR DEFAULT 'PENDING';
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_verified_by_id INTEGER REFERENCES users(id);

-- Add Stripe fields to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_provider VARCHAR DEFAULT 'MANUAL';

-- Add Stripe and billing fields to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_customer_id ON payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_business_verification_status ON users(business_verification_status);
