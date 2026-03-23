-- ============================================================
-- SEO & Growth: referrals + user growth fields
-- ============================================================

-- Add referral code and referred_by to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code    VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_credits INT NOT NULL DEFAULT 0;

-- Backfill referral codes for existing users (8-char uppercase alphanumeric)
UPDATE public.users
SET referral_code = UPPER(SUBSTRING(MD5(id::text || 'ref'), 1, 8))
WHERE referral_code IS NULL;

ALTER TABLE public.users
  ALTER COLUMN referral_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON public.users (referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users (referred_by);

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rewarded        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referred_user_id)
);

COMMENT ON TABLE public.referrals IS 'Tracks referrals: who invited whom and whether a reward was issued';

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals (referrer_id);

-- Add marketing email preference
ALTER TABLE public.email_preferences
  ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN NOT NULL DEFAULT TRUE;

-- Email drip campaign tracking
CREATE TYPE public.drip_campaign_type AS ENUM (
  'welcome_day1',
  'welcome_day3',
  'welcome_day7',
  'reengagement_day14'
);

CREATE TABLE IF NOT EXISTS public.email_drip_sent (
  id          UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID                        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign    public.drip_campaign_type   NOT NULL,
  sent_at     TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, campaign)
);

COMMENT ON TABLE public.email_drip_sent IS 'Tracks which drip campaign emails have been sent to each user to prevent duplicates';

CREATE INDEX IF NOT EXISTS idx_email_drip_sent_user_id ON public.email_drip_sent (user_id);
