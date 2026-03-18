-- Database initialisation for AI Prompting Education Platform
-- Runs automatically when the Postgres container is first created.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- users
-- Stores credentials and profile in one table (replaces
-- Supabase auth.users + public.profiles).
-- ============================================================
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  display_name  TEXT        NOT NULL,
  role          TEXT        NOT NULL CHECK (role IN ('instructor', 'trainee')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
