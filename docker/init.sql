-- Database initialisation for AI Prompting Education Platform
-- Runs automatically when the Postgres container is first created.
--
-- This file is the canonical Docker/standalone-PostgreSQL schema.
-- It incorporates all Supabase migration files (through 20260416000001)
-- and replaces the Supabase auth.users + public.profiles pattern with a
-- single standalone `users` table.  All foreign keys that migrations point
-- at `profiles(id)` are redirected to `users(id)` here.  A thin `profiles`
-- view is provided for backward compatibility with any queries that still
-- reference the profiles identifier.
-- RLS policies and auth.uid() references are omitted; access control is
-- handled at the application layer.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Enum types
-- ============================================================
CREATE TYPE notification_type AS ENUM (
  'discussion_reply',
  'peer_review_received',
  'new_workshop_from_followed',
  'peer_review_assigned'
);

CREATE TYPE drip_campaign_type AS ENUM (
  'welcome_day1',
  'welcome_day3',
  'welcome_day7',
  'reengagement_day14'
);

-- ============================================================
-- users
-- Stores credentials, profile, and auth state in one table.
-- Replaces the Supabase auth.users + public.profiles pattern.
-- ============================================================
CREATE TABLE users (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT         NOT NULL UNIQUE,
  password_hash      TEXT,
  display_name       TEXT         NOT NULL,
  role               TEXT         NOT NULL CHECK (role IN ('instructor', 'trainee')),
  oauth_provider     TEXT,
  oauth_provider_id  TEXT,
  stripe_customer_id TEXT         UNIQUE,
  is_admin           BOOLEAN      NOT NULL DEFAULT FALSE,
  is_disabled        BOOLEAN      NOT NULL DEFAULT FALSE,
  referral_code      VARCHAR(12)  UNIQUE,
  referred_by        UUID         REFERENCES users(id) ON DELETE SET NULL,
  referral_credits   INT          NOT NULL DEFAULT 0,
  bio                TEXT,
  avatar_url         TEXT,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT users_oauth_provider_id_unique UNIQUE (oauth_provider, oauth_provider_id)
);

CREATE INDEX idx_users_oauth         ON users (oauth_provider, oauth_provider_id)
  WHERE oauth_provider IS NOT NULL;
CREATE INDEX idx_users_is_admin      ON users (is_admin) WHERE is_admin = TRUE;
CREATE UNIQUE INDEX idx_users_referral_code ON users (referral_code)
  WHERE referral_code IS NOT NULL;
CREATE INDEX idx_users_referred_by   ON users (referred_by);

-- ============================================================
-- profiles view
-- Thin compatibility shim for code that still queries `profiles`.
-- ============================================================
CREATE VIEW profiles AS
  SELECT id, display_name, role, bio, avatar_url, created_at
  FROM   users;

-- ============================================================
-- workshop_categories  (needed before workshops FK)
-- ============================================================
CREATE TABLE workshop_categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  slug       TEXT        NOT NULL UNIQUE,
  icon       TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO workshop_categories (name, slug, icon, sort_order) VALUES
  ('Prompt Engineering',   'prompt-engineering',   '🧠', 1),
  ('Creative Writing',     'creative-writing',     '✍️', 2),
  ('Code Generation',      'code-generation',      '💻', 3),
  ('Data Analysis',        'data-analysis',        '📊', 4),
  ('Customer Support',     'customer-support',     '🎧', 5),
  ('Research & Synthesis', 'research-synthesis',   '🔬', 6),
  ('Marketing & Copy',     'marketing-copy',       '📣', 7),
  ('Education & Training', 'education-training',   '🎓', 8),
  ('Business Strategy',    'business-strategy',    '📈', 9),
  ('Other',                'other',                '📦', 10);

-- ============================================================
-- workshops
-- ============================================================
CREATE TABLE workshops (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT        NOT NULL,
  description         TEXT,
  instructor_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              TEXT        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'published', 'archived')),
  invite_code         TEXT        UNIQUE,
  default_provider    TEXT        NOT NULL DEFAULT 'anthropic'
                                  CHECK (default_provider IN ('anthropic', 'openai', 'google')),
  peer_review_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
  category_id         UUID        REFERENCES workshop_categories(id) ON DELETE SET NULL,
  is_featured         BOOLEAN     NOT NULL DEFAULT FALSE,
  trending_score      NUMERIC     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workshops_instructor_id  ON workshops (instructor_id);
CREATE INDEX idx_workshops_status         ON workshops (status);
CREATE INDEX idx_workshops_category_id    ON workshops (category_id);
CREATE INDEX idx_workshops_trending_score ON workshops (trending_score DESC);

-- ============================================================
-- exercises
-- ============================================================
CREATE TABLE exercises (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id        UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  title              TEXT        NOT NULL,
  instructions       TEXT        NOT NULL,
  system_prompt      TEXT,
  model_config       JSONB       NOT NULL DEFAULT '{}',
  rubric             JSONB       NOT NULL DEFAULT '[]',
  sort_order         INTEGER     NOT NULL DEFAULT 0,
  exercise_type      TEXT        NOT NULL DEFAULT 'standard'
                                 CHECK (exercise_type IN ('standard', 'multi_step', 'comparison', 'constrained')),
  difficulty         TEXT        NOT NULL DEFAULT 'beginner'
                                 CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  constraints        JSONB       NOT NULL DEFAULT '{}',
  open_at            TIMESTAMPTZ,
  close_at           TIMESTAMPTZ,
  criterion_weights  JSONB       NOT NULL DEFAULT '{}',
  variant_group      TEXT,
  variant_key        TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_exercise_schedule CHECK (
    open_at IS NULL OR close_at IS NULL OR close_at > open_at
  )
);

CREATE INDEX idx_exercises_workshop_id ON exercises (workshop_id);
CREATE INDEX idx_exercises_sort_order  ON exercises (workshop_id, sort_order);
CREATE INDEX idx_exercises_difficulty  ON exercises (difficulty);
CREATE INDEX idx_exercises_type        ON exercises (exercise_type);

-- ============================================================
-- exercise_steps  (for multi_step exercises)
-- ============================================================
CREATE TABLE exercise_steps (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id   UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  step_number   INTEGER     NOT NULL,
  instructions  TEXT        NOT NULL,
  system_prompt TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_exercise_step UNIQUE (exercise_id, step_number)
);

CREATE INDEX idx_exercise_steps_exercise_id ON exercise_steps (exercise_id);
CREATE INDEX idx_exercise_steps_order       ON exercise_steps (exercise_id, step_number);

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

CREATE INDEX idx_submissions_exercise_id       ON submissions (exercise_id);
CREATE INDEX idx_submissions_trainee_id        ON submissions (trainee_id);
CREATE INDEX idx_submissions_trainee_submitted ON submissions (trainee_id, submitted_at DESC);

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
-- ============================================================
CREATE TABLE enrollments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id)
);

CREATE INDEX idx_enrollments_workshop_id ON enrollments (workshop_id);
CREATE INDEX idx_enrollments_trainee_id  ON enrollments (trainee_id);

-- ============================================================
-- streaks
-- ============================================================
CREATE TABLE streaks (
  trainee_id     UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT         NOT NULL DEFAULT 0,
  longest_streak INT         NOT NULL DEFAULT 0,
  last_sub_date  DATE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- user_badges
-- ============================================================
CREATE TABLE user_badges (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT        NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trainee_id, badge_type)
);

CREATE INDEX idx_user_badges_trainee_id ON user_badges (trainee_id);

-- ============================================================
-- subscriptions
-- ============================================================
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

CREATE INDEX idx_subscriptions_user_id             ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id  ON subscriptions (stripe_customer_id);

-- ============================================================
-- email_preferences
-- ============================================================
CREATE TABLE email_preferences (
  user_id          UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score_notify     BOOLEAN     NOT NULL DEFAULT TRUE,
  workshop_invite  BOOLEAN     NOT NULL DEFAULT TRUE,
  marketing_emails BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- llm_call_logs
-- ============================================================
CREATE TABLE llm_call_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  provider      TEXT        NOT NULL,
  model         TEXT        NOT NULL,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_llm_call_logs_submission_id ON llm_call_logs (submission_id);

-- ============================================================
-- flagged_content  (content moderation queue)
-- ============================================================
CREATE TABLE flagged_content (
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

CREATE INDEX idx_flagged_content_status  ON flagged_content (status);
CREATE INDEX idx_flagged_content_type_id ON flagged_content (content_type, content_id);

-- ============================================================
-- learning_paths
-- ============================================================
CREATE TABLE learning_paths (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  instructor_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published', 'archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learning_paths_instructor_id     ON learning_paths (instructor_id);
CREATE INDEX idx_learning_paths_status            ON learning_paths (status);
CREATE INDEX idx_learning_paths_instructor_status ON learning_paths (instructor_id, status);

-- ============================================================
-- learning_path_workshops
-- ============================================================
CREATE TABLE learning_path_workshops (
  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id                  UUID    NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  workshop_id              UUID    NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  sort_order               INTEGER NOT NULL DEFAULT 0,
  prerequisite_workshop_id UUID    REFERENCES workshops(id) ON DELETE SET NULL,
  UNIQUE (path_id, workshop_id)
);

CREATE INDEX idx_lpw_path_id     ON learning_path_workshops (path_id);
CREATE INDEX idx_lpw_workshop_id ON learning_path_workshops (workshop_id);
CREATE INDEX idx_lpw_path_order  ON learning_path_workshops (path_id, sort_order);
CREATE INDEX idx_lpw_prereq      ON learning_path_workshops (prerequisite_workshop_id)
  WHERE prerequisite_workshop_id IS NOT NULL;

-- ============================================================
-- learning_path_enrollments
-- ============================================================
CREATE TABLE learning_path_enrollments (
  path_id     UUID        NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (path_id, trainee_id)
);

CREATE INDEX idx_lpe_trainee_id ON learning_path_enrollments (trainee_id);

-- ============================================================
-- certificates
-- ============================================================
CREATE TABLE certificates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workshop_id       UUID        REFERENCES workshops(id) ON DELETE SET NULL,
  path_id           UUID        REFERENCES learning_paths(id) ON DELETE SET NULL,
  type              TEXT        NOT NULL CHECK (type IN ('workshop', 'learning_path')),
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_code TEXT        NOT NULL UNIQUE,
  trainee_name      TEXT        NOT NULL,
  entity_title      TEXT        NOT NULL,
  instructor_name   TEXT        NOT NULL,
  total_score       INT         NOT NULL DEFAULT 0,
  max_score         INT         NOT NULL DEFAULT 0,
  exercise_count    INT         NOT NULL DEFAULT 0,
  CONSTRAINT certificate_target_check CHECK (
    (workshop_id IS NOT NULL AND path_id IS NULL AND type = 'workshop') OR
    (path_id IS NOT NULL AND workshop_id IS NULL AND type = 'learning_path')
  )
);

CREATE UNIQUE INDEX idx_certificates_trainee_workshop
  ON certificates (trainee_id, workshop_id) WHERE workshop_id IS NOT NULL;
CREATE UNIQUE INDEX idx_certificates_trainee_path
  ON certificates (trainee_id, path_id)     WHERE path_id IS NOT NULL;
CREATE INDEX idx_certificates_trainee_id        ON certificates (trainee_id);
CREATE INDEX idx_certificates_verification_code ON certificates (verification_code);
CREATE INDEX idx_certificates_workshop_id       ON certificates (workshop_id);
CREATE INDEX idx_certificates_path_id           ON certificates (path_id);

-- ============================================================
-- workshop_tags
-- ============================================================
CREATE TABLE workshop_tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- workshop_tag_links
-- ============================================================
CREATE TABLE workshop_tag_links (
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES workshop_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (workshop_id, tag_id)
);

CREATE INDEX idx_workshop_tag_links_tag_id ON workshop_tag_links (tag_id);

-- ============================================================
-- workshop_reviews  (profiles(id) → users(id))
-- ============================================================
CREATE TABLE workshop_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id)
);

CREATE INDEX idx_workshop_reviews_workshop_id ON workshop_reviews (workshop_id);
CREATE INDEX idx_workshop_reviews_trainee_id  ON workshop_reviews (trainee_id);

-- ============================================================
-- discussions  (profiles(id) → users(id))
-- ============================================================
CREATE TABLE discussions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  parent_id   UUID        REFERENCES discussions(id) ON DELETE CASCADE,
  is_pinned   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discussions_exercise_id ON discussions (exercise_id, created_at DESC);
CREATE INDEX idx_discussions_parent_id   ON discussions (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_discussions_author_id   ON discussions (author_id);

-- ============================================================
-- peer_reviews  (profiles(id) → users(id))
-- ============================================================
CREATE TABLE peer_reviews (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_text TEXT        NOT NULL CHECK (char_length(feedback_text) BETWEEN 10 AND 3000),
  rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, reviewer_id)
);

CREATE INDEX idx_peer_reviews_submission_id ON peer_reviews (submission_id);
CREATE INDEX idx_peer_reviews_reviewer_id   ON peer_reviews (reviewer_id);

-- ============================================================
-- peer_review_assignments  (profiles(id) → users(id))
-- ============================================================
CREATE TABLE peer_review_assignments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  reviewer_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id UUID        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  UNIQUE (reviewer_id, submission_id)
);

CREATE INDEX idx_pra_workshop_id   ON peer_review_assignments (workshop_id);
CREATE INDEX idx_pra_reviewer_id   ON peer_review_assignments (reviewer_id, completed_at);
CREATE INDEX idx_pra_submission_id ON peer_review_assignments (submission_id);

-- ============================================================
-- follows  (profiles(id) → users(id))
-- ============================================================
CREATE TABLE follows (
  follower_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, instructor_id),
  CHECK (follower_id <> instructor_id)
);

CREATE INDEX idx_follows_instructor_id ON follows (instructor_id);

-- ============================================================
-- notifications  (profiles(id) → users(id))
-- ============================================================
CREATE TABLE notifications (
  id         UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  payload    JSONB             NOT NULL DEFAULT '{}',
  read       BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, created_at DESC) WHERE read = FALSE;
CREATE INDEX idx_notifications_user_id     ON notifications (user_id, created_at DESC);

-- ============================================================
-- referrals
-- ============================================================
CREATE TABLE referrals (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rewarded         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referred_user_id)
);

CREATE INDEX idx_referrals_referrer_id ON referrals (referrer_id);

-- ============================================================
-- email_drip_sent
-- ============================================================
CREATE TABLE email_drip_sent (
  id       UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign drip_campaign_type NOT NULL,
  sent_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, campaign)
);

CREATE INDEX idx_email_drip_sent_user_id ON email_drip_sent (user_id);

-- ============================================================
-- cohorts
-- ============================================================
CREATE TABLE cohorts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cohorts_workshop_id ON cohorts (workshop_id);

-- ============================================================
-- cohort_members  (profiles(id) → users(id))
-- ============================================================
CREATE TABLE cohort_members (
  cohort_id  UUID        NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  trainee_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cohort_id, trainee_id)
);

CREATE INDEX idx_cohort_members_trainee_id ON cohort_members (trainee_id);

-- ============================================================
-- announcements  (profiles(id) → users(id))
-- ============================================================
CREATE TABLE announcements (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  instructor_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_workshop_id ON announcements (workshop_id);

-- ============================================================
-- score_overrides  (profiles(id) → users(id))
-- ============================================================
CREATE TABLE score_overrides (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  instructor_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_score   NUMERIC     NOT NULL CHECK (total_score >= 0),
  reason        TEXT        NOT NULL,
  overridden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id)
);

CREATE INDEX idx_score_overrides_submission_id ON score_overrides (submission_id);

-- ============================================================
-- exercise_variant_assignments  (A/B testing)
-- ============================================================
CREATE TABLE exercise_variant_assignments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  trainee_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_group TEXT        NOT NULL,
  exercise_id   UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id, variant_group)
);

CREATE INDEX idx_variant_assignments_workshop ON exercise_variant_assignments (workshop_id);
CREATE INDEX idx_variant_assignments_trainee  ON exercise_variant_assignments (trainee_id);

-- ============================================================
-- admin_audit_log
-- ============================================================
CREATE TABLE admin_audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   TEXT        NOT NULL,
  changes     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_admin_id   ON admin_audit_log (admin_id);
CREATE INDEX idx_admin_audit_log_entity     ON admin_audit_log (entity_type, entity_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC);
