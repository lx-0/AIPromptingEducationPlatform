-- Migration: Instructor Power Tools (M8.4)
-- Adds: cohorts, cohort_members, exercise scheduling, announcements, score overrides

-- ============================================================
-- Exercise scheduling: open_at / close_at windows
-- ============================================================
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS open_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS close_at  TIMESTAMPTZ,
  ADD CONSTRAINT chk_exercise_schedule
    CHECK (open_at IS NULL OR close_at IS NULL OR close_at > open_at);

COMMENT ON COLUMN public.exercises.open_at  IS 'Submissions allowed on/after this time (NULL = always open)';
COMMENT ON COLUMN public.exercises.close_at IS 'Submissions locked after this time (NULL = never closes)';

-- ============================================================
-- Cohorts: named sections within a workshop
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cohorts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cohorts IS 'Named sections / cohorts within a workshop';

CREATE INDEX idx_cohorts_workshop_id ON public.cohorts (workshop_id);

-- ============================================================
-- Cohort membership
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cohort_members (
  cohort_id  UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cohort_id, trainee_id)
);

COMMENT ON TABLE public.cohort_members IS 'Maps trainees to cohorts';

CREATE INDEX idx_cohort_members_trainee_id ON public.cohort_members (trainee_id);

-- ============================================================
-- Announcements: instructor posts to all enrolled trainees
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  instructor_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.announcements IS 'Workshop announcements posted by instructors';

CREATE INDEX idx_announcements_workshop_id ON public.announcements (workshop_id);

-- ============================================================
-- Score overrides: instructor manual override with reason
-- ============================================================
CREATE TABLE IF NOT EXISTS public.score_overrides (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  instructor_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_score   NUMERIC     NOT NULL CHECK (total_score >= 0),
  reason        TEXT        NOT NULL,
  overridden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id)  -- one active override per submission
);

COMMENT ON TABLE public.score_overrides IS 'Manual instructor score overrides with justification';

CREATE INDEX idx_score_overrides_submission_id ON public.score_overrides (submission_id);

-- ============================================================
-- Rubric criterion weights on scores (store weights snapshot)
-- ============================================================
-- Add optional criterion_weights column to exercises to store per-criterion weights
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS criterion_weights JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.exercises.criterion_weights IS 'JSON map of criterion -> weight multiplier, e.g. {"Clarity": 2.0}';
