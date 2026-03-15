-- Migration: Create core schema for AI Prompting Education Platform
-- Tables: profiles, workshops, exercises, submissions, scores

-- Enable UUID extension (already available in Supabase, but safe to declare)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- profiles
-- Extends auth.users; one row per authenticated user.
-- ============================================================
CREATE TABLE public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT        NOT NULL,
  role         TEXT        NOT NULL CHECK (role IN ('instructor', 'trainee')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profile extending Supabase auth.users';
COMMENT ON COLUMN public.profiles.role IS 'instructor: creates and grades; trainee: participates';

-- Auto-create a profile row when a new auth user is inserted.
-- The user must supply display_name and role via user_metadata on sign-up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'trainee')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- workshops
-- Created by instructors; trainees join via invite_code.
-- ============================================================
CREATE TABLE public.workshops (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  instructor_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published', 'archived')),
  invite_code   TEXT        UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.workshops IS 'Workshops created and managed by instructors';
COMMENT ON COLUMN public.workshops.invite_code IS 'Short unique code trainees use to join the workshop';

CREATE INDEX idx_workshops_instructor_id ON public.workshops (instructor_id);
CREATE INDEX idx_workshops_status        ON public.workshops (status);

-- ============================================================
-- exercises
-- Belong to a workshop; define the prompting challenge.
-- ============================================================
CREATE TABLE public.exercises (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  instructions  TEXT        NOT NULL,
  system_prompt TEXT,
  -- model_config: { "provider": "anthropic", "model": "claude-3-5-sonnet-20241022", "temperature": 0.7 }
  model_config  JSONB       NOT NULL DEFAULT '{}',
  -- rubric: [ { "criterion": "Clarity", "max_points": 10, "description": "..." } ]
  rubric        JSONB       NOT NULL DEFAULT '[]',
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.exercises IS 'Individual prompting challenges within a workshop';
COMMENT ON COLUMN public.exercises.model_config IS 'JSON: provider, model, temperature, max_tokens, etc.';
COMMENT ON COLUMN public.exercises.rubric IS 'JSON array of scoring criteria with max_points each';

CREATE INDEX idx_exercises_workshop_id ON public.exercises (workshop_id);
CREATE INDEX idx_exercises_sort_order  ON public.exercises (workshop_id, sort_order);

-- ============================================================
-- submissions
-- A trainee's prompt attempt for a specific exercise.
-- ============================================================
CREATE TABLE public.submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id  UUID        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  trainee_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_text  TEXT        NOT NULL,
  llm_response TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.submissions IS 'Trainee prompt submissions for exercises';

CREATE INDEX idx_submissions_exercise_id ON public.submissions (exercise_id);
CREATE INDEX idx_submissions_trainee_id  ON public.submissions (trainee_id);

-- ============================================================
-- scores
-- Scoring result for a submission (instructor or automated).
-- ============================================================
CREATE TABLE public.scores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  total_score   NUMERIC     NOT NULL CHECK (total_score >= 0),
  max_score     NUMERIC     NOT NULL CHECK (max_score > 0),
  -- feedback: { "criteria": [ { "criterion": "Clarity", "score": 8, "comment": "..." } ], "overall": "..." }
  feedback      JSONB       NOT NULL DEFAULT '{}',
  scored_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.scores IS 'Scoring results for trainee submissions';
COMMENT ON COLUMN public.scores.feedback IS 'JSON with per-criterion breakdown and overall comment';

CREATE INDEX idx_scores_submission_id ON public.scores (submission_id);
