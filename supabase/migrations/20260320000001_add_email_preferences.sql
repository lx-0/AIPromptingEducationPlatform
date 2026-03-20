-- Email preferences per user.
-- Rows are created with defaults on signup.
CREATE TABLE email_preferences (
  user_id         UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score_notify    BOOLEAN     NOT NULL DEFAULT TRUE,
  workshop_invite BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
