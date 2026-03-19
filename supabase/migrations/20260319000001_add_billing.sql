-- Add Stripe billing support
-- Adds stripe_customer_id to users and a subscriptions table.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT        NOT NULL UNIQUE,
  stripe_customer_id     TEXT        NOT NULL,
  plan                   TEXT        NOT NULL CHECK (plan IN ('free', 'pro', 'team')),
  status                 TEXT        NOT NULL,  -- Stripe status: active, past_due, canceled, etc.
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id             ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id  ON subscriptions (stripe_customer_id);
CREATE UNIQUE INDEX idx_subscriptions_stripe_sub_id ON subscriptions (stripe_subscription_id);
