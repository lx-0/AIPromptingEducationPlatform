-- Migration: Add admin role, disabled flag, and content moderation table

-- Add is_admin flag to users (defaults false for all existing users)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users (is_admin) WHERE is_admin = TRUE;

-- Flagged content queue for content moderation
CREATE TABLE IF NOT EXISTS flagged_content (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
  content_type TEXT        NOT NULL CHECK (content_type IN ('submission', 'workshop', 'exercise')),
  content_id   UUID        NOT NULL,
  reason       TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flagged_content_status       ON flagged_content (status);
CREATE INDEX IF NOT EXISTS idx_flagged_content_type_id      ON flagged_content (content_type, content_id);
