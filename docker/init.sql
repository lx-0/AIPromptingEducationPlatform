-- Database initialisation for AI Prompting Education Platform
-- Runs automatically when the Postgres container is first created.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- users
-- Stores credentials and profile in one table (replaces
-- Supabase auth.users + public.profiles).
-- ============================================================
CREATE TABLE users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT        NOT NULL UNIQUE,
  password_hash    TEXT,
  display_name     TEXT        NOT NULL,
  role             TEXT        NOT NULL CHECK (role IN ('instructor', 'trainee')),
  oauth_provider   TEXT,
  oauth_provider_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_oauth_provider_id_unique UNIQUE (oauth_provider, oauth_provider_id)
);

CREATE INDEX idx_users_oauth
  ON users (oauth_provider, oauth_provider_id)
  WHERE oauth_provider IS NOT NULL;

-- ============================================================
-- workshops
-- ============================================================
CREATE TABLE workshops (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  instructor_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published', 'archived')),
  invite_code   TEXT        UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workshops_instructor_id ON workshops (instructor_id);
CREATE INDEX idx_workshops_status        ON workshops (status);

-- ============================================================
-- exercises
-- ============================================================
CREATE TABLE exercises (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  instructions  TEXT        NOT NULL,
  system_prompt TEXT,
  model_config  JSONB       NOT NULL DEFAULT '{}',
  rubric        JSONB       NOT NULL DEFAULT '[]',
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_workshop_id ON exercises (workshop_id);
CREATE INDEX idx_exercises_sort_order  ON exercises (workshop_id, sort_order);

-- ============================================================
-- submissions
-- ============================================================
CREATE TABLE submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id  UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  trainee_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_text  TEXT        NOT NULL,
  llm_response TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_exercise_id ON submissions (exercise_id);
CREATE INDEX idx_submissions_trainee_id  ON submissions (trainee_id);

-- ============================================================
-- scores
-- ============================================================
CREATE TABLE scores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  total_score   NUMERIC     NOT NULL CHECK (total_score >= 0),
  max_score     NUMERIC     NOT NULL CHECK (max_score > 0),
  feedback      JSONB       NOT NULL DEFAULT '{}',
  scored_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_submission_id ON scores (submission_id);

-- ============================================================
-- enrollments
-- Tracks which trainees have joined which workshops.
-- ============================================================
CREATE TABLE enrollments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id  UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  trainee_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id)
);

CREATE INDEX idx_enrollments_workshop_id ON enrollments (workshop_id);
CREATE INDEX idx_enrollments_trainee_id  ON enrollments (trainee_id);

-- ============================================================
-- streaks
-- Tracks consecutive submission-days per trainee (global).
-- ============================================================
CREATE TABLE streaks (
  trainee_id      UUID  PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak  INT   NOT NULL DEFAULT 0,
  longest_streak  INT   NOT NULL DEFAULT 0,
  last_sub_date   DATE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- user_badges
-- One row per earned badge per trainee (unique per badge_type).
-- ============================================================
CREATE TABLE user_badges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type  TEXT        NOT NULL,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trainee_id, badge_type)
);

CREATE INDEX idx_user_badges_trainee_id ON user_badges (trainee_id);

-- ============================================================
-- subscriptions
-- Tracks Stripe subscription state per instructor user.
-- ============================================================
ALTER TABLE users
  ADD COLUMN stripe_customer_id TEXT UNIQUE;

CREATE TABLE subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT        NOT NULL UNIQUE,
  stripe_customer_id     TEXT        NOT NULL,
  plan                   TEXT        NOT NULL CHECK (plan IN ('free', 'pro', 'team')),
  status                 TEXT        NOT NULL,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id            ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions (stripe_customer_id);

-- ============================================================
-- email_preferences
-- Per-user opt-in/out for transactional emails.
-- Created with defaults on signup.
-- ============================================================
CREATE TABLE email_preferences (
  user_id         UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score_notify    BOOLEAN     NOT NULL DEFAULT TRUE,
  workshop_invite BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- llm_call_logs
-- Tracks token usage and cost per LLM call for observability
-- and per-provider cost accounting.
-- ============================================================
CREATE TABLE llm_call_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID        REFERENCES submissions(id) ON DELETE SET NULL,
  provider        TEXT        NOT NULL,
  model           TEXT        NOT NULL,
  input_tokens    INTEGER     NOT NULL DEFAULT 0,
  output_tokens   INTEGER     NOT NULL DEFAULT 0,
  called_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_llm_call_logs_submission_id ON llm_call_logs (submission_id);
CREATE INDEX idx_llm_call_logs_provider      ON llm_call_logs (provider);
CREATE INDEX idx_llm_call_logs_called_at     ON llm_call_logs (called_at);
