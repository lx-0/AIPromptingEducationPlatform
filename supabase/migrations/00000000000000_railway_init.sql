-- Railway-compatible consolidated schema for AI Prompting Education Platform
-- Replaces Supabase auth.users + profiles with a standalone users table.
-- Run this once against a fresh Railway Postgres instance.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop partial tables from failed migration attempts
DROP TABLE IF EXISTS public.workshop_tag_links CASCADE;
DROP TABLE IF EXISTS public.workshop_tags CASCADE;
DROP TABLE IF EXISTS public.workshop_categories CASCADE;

-- ============================================================
-- ENUM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'discussion_reply',
    'peer_review_received',
    'new_workshop_from_followed',
    'peer_review_assigned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.drip_campaign_type AS ENUM (
    'welcome_day1',
    'welcome_day3',
    'welcome_day7',
    'reengagement_day14'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- USERS (replaces Supabase auth.users + profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT        NOT NULL UNIQUE,
  password_hash     TEXT,
  display_name      TEXT        NOT NULL,
  role              TEXT        NOT NULL CHECK (role IN ('instructor', 'trainee')),
  bio               TEXT,
  avatar_url        TEXT,
  stripe_customer_id TEXT        UNIQUE,
  is_admin          BOOLEAN     NOT NULL DEFAULT FALSE,
  is_disabled       BOOLEAN     NOT NULL DEFAULT FALSE,
  referral_code     VARCHAR(12) UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::text), 1, 8)),
  referred_by       UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  referral_credits  INT         NOT NULL DEFAULT 0,
  oauth_provider    TEXT,
  oauth_provider_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_oauth_unique UNIQUE (oauth_provider, oauth_provider_id)
);

CREATE INDEX IF NOT EXISTS idx_users_is_admin        ON public.users (is_admin)   WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_oauth           ON public.users (oauth_provider, oauth_provider_id) WHERE oauth_provider IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON public.users (referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by     ON public.users (referred_by);

-- VIEW for backwards-compat with queries that JOIN on profiles
CREATE OR REPLACE VIEW public.profiles AS
  SELECT id, display_name, role, bio, avatar_url, created_at FROM public.users;

-- ============================================================
-- WORKSHOP CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workshop_categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  slug       TEXT        NOT NULL UNIQUE,
  icon       TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.workshop_categories (name, slug, icon, sort_order) VALUES
  ('Prompt Engineering',   'prompt-engineering', '🧠', 1),
  ('Creative Writing',     'creative-writing',   '✍️', 2),
  ('Code Generation',      'code-generation',    '💻', 3),
  ('Data Analysis',        'data-analysis',      '📊', 4),
  ('Customer Support',     'customer-support',   '🎧', 5),
  ('Research & Synthesis', 'research-synthesis', '🔬', 6),
  ('Marketing & Copy',     'marketing-copy',     '📣', 7),
  ('Education & Training', 'education-training', '🎓', 8),
  ('Business Strategy',    'business-strategy',  '📈', 9),
  ('Other',                'other',              '📦', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- WORKSHOP TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workshop_tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKSHOPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workshops (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT        NOT NULL,
  description         TEXT,
  instructor_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status              TEXT        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'published', 'archived')),
  invite_code         TEXT        UNIQUE,
  category_id         UUID        REFERENCES public.workshop_categories(id) ON DELETE SET NULL,
  is_featured         BOOLEAN     NOT NULL DEFAULT FALSE,
  trending_score      NUMERIC     NOT NULL DEFAULT 0,
  peer_review_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
  default_provider    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workshops_instructor_id     ON public.workshops (instructor_id);
CREATE INDEX IF NOT EXISTS idx_workshops_status            ON public.workshops (status);
CREATE INDEX IF NOT EXISTS idx_workshops_category_id       ON public.workshops (category_id);
CREATE INDEX IF NOT EXISTS idx_workshops_trending_score    ON public.workshops (trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_workshops_instructor_status ON public.workshops (instructor_id, status);

-- ============================================================
-- EXERCISES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id       UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  title             TEXT        NOT NULL,
  instructions      TEXT        NOT NULL,
  system_prompt     TEXT,
  model_config      JSONB       NOT NULL DEFAULT '{}',
  rubric            JSONB       NOT NULL DEFAULT '[]',
  criterion_weights JSONB       NOT NULL DEFAULT '{}',
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  exercise_type     TEXT        NOT NULL DEFAULT 'standard'
                                CHECK (exercise_type IN ('standard', 'multi_step', 'comparison', 'constrained')),
  difficulty        TEXT        NOT NULL DEFAULT 'beginner'
                                CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  constraints       JSONB       NOT NULL DEFAULT '{}',
  open_at           TIMESTAMPTZ,
  close_at          TIMESTAMPTZ,
  variant_group     TEXT,
  variant_key       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_exercise_schedule CHECK (open_at IS NULL OR close_at IS NULL OR close_at > open_at)
);

CREATE INDEX IF NOT EXISTS idx_exercises_workshop_id  ON public.exercises (workshop_id);
CREATE INDEX IF NOT EXISTS idx_exercises_sort_order   ON public.exercises (workshop_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty   ON public.exercises (difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_type         ON public.exercises (exercise_type);

-- ============================================================
-- EXERCISE STEPS (multi_step exercises)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercise_steps (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id   UUID        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  step_number   INTEGER     NOT NULL,
  instructions  TEXT        NOT NULL,
  system_prompt TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_exercise_step UNIQUE (exercise_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_exercise_steps_exercise_id ON public.exercise_steps (exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_steps_order       ON public.exercise_steps (exercise_id, step_number);

-- ============================================================
-- SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id  UUID        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  trainee_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prompt_text  TEXT        NOT NULL,
  llm_response TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_exercise_id      ON public.submissions (exercise_id);
CREATE INDEX IF NOT EXISTS idx_submissions_trainee_id       ON public.submissions (trainee_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at     ON public.submissions (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_exercise_trainee ON public.submissions (exercise_id, trainee_id);

-- ============================================================
-- SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  total_score   NUMERIC     NOT NULL CHECK (total_score >= 0),
  max_score     NUMERIC     NOT NULL CHECK (max_score > 0),
  feedback      JSONB       NOT NULL DEFAULT '{}',
  scored_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_submission_id ON public.scores (submission_id);
CREATE INDEX IF NOT EXISTS idx_scores_scored_at     ON public.scores (scored_at DESC);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_workshop_id       ON public.enrollments (workshop_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_trainee_id        ON public.enrollments (trainee_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_workshop_trainee  ON public.enrollments (workshop_id, trainee_id);

-- ============================================================
-- EMAIL PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_preferences (
  user_id          UUID        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  score_notify     BOOLEAN     NOT NULL DEFAULT TRUE,
  workshop_invite  BOOLEAN     NOT NULL DEFAULT TRUE,
  marketing_emails BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id             ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id  ON public.subscriptions (stripe_customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON public.subscriptions (stripe_subscription_id);

-- ============================================================
-- LEARNING PATHS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  instructor_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published', 'archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_instructor_id     ON public.learning_paths (instructor_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status            ON public.learning_paths (status);
CREATE INDEX IF NOT EXISTS idx_learning_paths_instructor_status ON public.learning_paths (instructor_id, status);

-- ============================================================
-- LEARNING PATH WORKSHOPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learning_path_workshops (
  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id                  UUID    NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  workshop_id              UUID    NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  sort_order               INTEGER NOT NULL DEFAULT 0,
  prerequisite_workshop_id UUID    REFERENCES public.workshops(id) ON DELETE SET NULL,
  UNIQUE (path_id, workshop_id)
);

CREATE INDEX IF NOT EXISTS idx_lpw_path_id     ON public.learning_path_workshops (path_id);
CREATE INDEX IF NOT EXISTS idx_lpw_workshop_id ON public.learning_path_workshops (workshop_id);
CREATE INDEX IF NOT EXISTS idx_lpw_path_order  ON public.learning_path_workshops (path_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lpw_prereq      ON public.learning_path_workshops (prerequisite_workshop_id) WHERE prerequisite_workshop_id IS NOT NULL;

-- ============================================================
-- LEARNING PATH ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learning_path_enrollments (
  path_id     UUID        NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (path_id, trainee_id)
);

CREATE INDEX IF NOT EXISTS idx_lpe_trainee_id ON public.learning_path_enrollments (trainee_id);

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workshop_id       UUID        REFERENCES public.workshops(id) ON DELETE SET NULL,
  path_id           UUID        REFERENCES public.learning_paths(id) ON DELETE SET NULL,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_trainee_workshop ON public.certificates (trainee_id, workshop_id) WHERE workshop_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_trainee_path     ON public.certificates (trainee_id, path_id) WHERE path_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_certificates_trainee_id              ON public.certificates (trainee_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code       ON public.certificates (verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_workshop_id             ON public.certificates (workshop_id);
CREATE INDEX IF NOT EXISTS idx_certificates_path_id                 ON public.certificates (path_id);

-- ============================================================
-- GAMIFICATION: STREAKS & BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.streaks (
  trainee_id     UUID  PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak INT   NOT NULL DEFAULT 0,
  longest_streak INT   NOT NULL DEFAULT 0,
  last_sub_date  DATE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type TEXT        NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trainee_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_trainee_id ON public.user_badges (trainee_id);

-- ============================================================
-- WORKSHOP TAG LINKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workshop_tag_links (
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES public.workshop_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (workshop_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_workshop_tag_links_tag_id ON public.workshop_tag_links (tag_id);

-- ============================================================
-- WORKSHOP REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workshop_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id)
);

CREATE INDEX IF NOT EXISTS idx_workshop_reviews_workshop_id ON public.workshop_reviews (workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_reviews_trainee_id  ON public.workshop_reviews (trainee_id);

-- ============================================================
-- DISCUSSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body        TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  parent_id   UUID        REFERENCES public.discussions(id) ON DELETE CASCADE,
  is_pinned   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussions_exercise_id ON public.discussions (exercise_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id   ON public.discussions (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discussions_author_id   ON public.discussions (author_id);

-- ============================================================
-- PEER REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.peer_reviews (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID      NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id   UUID      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feedback_text TEXT      NOT NULL CHECK (char_length(feedback_text) BETWEEN 10 AND 3000),
  rating        SMALLINT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_peer_reviews_submission_id ON public.peer_reviews (submission_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer_id   ON public.peer_reviews (reviewer_id);

-- ============================================================
-- PEER REVIEW ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.peer_review_assignments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  reviewer_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submission_id UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  UNIQUE (reviewer_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_pra_workshop_id   ON public.peer_review_assignments (workshop_id);
CREATE INDEX IF NOT EXISTS idx_pra_reviewer_id   ON public.peer_review_assignments (reviewer_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_pra_submission_id ON public.peer_review_assignments (submission_id);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  instructor_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, instructor_id),
  CHECK (follower_id <> instructor_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_instructor_id ON public.follows (instructor_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID                     NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       public.notification_type NOT NULL,
  payload    JSONB                    NOT NULL DEFAULT '{}',
  read       BOOLEAN                  NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, created_at DESC) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON public.notifications (user_id, created_at DESC);

-- ============================================================
-- COHORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cohorts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cohorts_workshop_id ON public.cohorts (workshop_id);

-- ============================================================
-- COHORT MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cohort_members (
  cohort_id  UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cohort_id, trainee_id)
);

CREATE INDEX IF NOT EXISTS idx_cohort_members_trainee_id ON public.cohort_members (trainee_id);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  instructor_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_workshop_id ON public.announcements (workshop_id);

-- ============================================================
-- SCORE OVERRIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.score_overrides (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  instructor_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_score   NUMERIC     NOT NULL CHECK (total_score >= 0),
  reason        TEXT        NOT NULL,
  overridden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id)
);

CREATE INDEX IF NOT EXISTS idx_score_overrides_submission_id ON public.score_overrides (submission_id);

-- ============================================================
-- FLAGGED CONTENT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flagged_content (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  content_type TEXT        NOT NULL CHECK (content_type IN ('submission', 'workshop', 'exercise')),
  content_id   UUID        NOT NULL,
  reason       TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by  UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flagged_content_status  ON public.flagged_content (status);
CREATE INDEX IF NOT EXISTS idx_flagged_content_type_id ON public.flagged_content (content_type, content_id);

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   TEXT        NOT NULL,
  changes     JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id   ON public.admin_audit_log (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity     ON public.admin_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rewarded         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals (referrer_id);

-- ============================================================
-- EMAIL DRIP SENT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_drip_sent (
  id       UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID                      NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign public.drip_campaign_type NOT NULL,
  sent_at  TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, campaign)
);

CREATE INDEX IF NOT EXISTS idx_email_drip_sent_user_id ON public.email_drip_sent (user_id);

-- ============================================================
-- LLM CALL LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.llm_call_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  provider      TEXT        NOT NULL,
  model         TEXT        NOT NULL,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_call_logs_submission_id ON public.llm_call_logs (submission_id);

-- ============================================================
-- EXERCISE VARIANT ASSIGNMENTS (A/B testing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercise_variant_assignments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  trainee_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  variant_group TEXT        NOT NULL,
  exercise_id   UUID        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id, variant_group)
);

CREATE INDEX IF NOT EXISTS idx_variant_assignments_workshop ON public.exercise_variant_assignments (workshop_id);
CREATE INDEX IF NOT EXISTS idx_variant_assignments_trainee  ON public.exercise_variant_assignments (trainee_id);

COMMIT;
