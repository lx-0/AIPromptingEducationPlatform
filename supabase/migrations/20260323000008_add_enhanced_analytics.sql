-- Migration: Enhanced Analytics & Reporting (M8.5)
-- Adds: A/B exercise variant groups, trainee report snapshots

-- ============================================================
-- A/B Exercise variants: variant_group + variant_key on exercises
-- ============================================================
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS variant_group TEXT,
  ADD COLUMN IF NOT EXISTS variant_key   TEXT;

COMMENT ON COLUMN public.exercises.variant_group IS 'Shared group name for A/B variant exercises (NULL = not part of A/B test)';
COMMENT ON COLUMN public.exercises.variant_key   IS 'Variant identifier within the group, e.g. ''A'', ''B'', ''C''';

-- ============================================================
-- Trainee variant assignments: which variant a trainee was assigned
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercise_variant_assignments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  variant_group TEXT      NOT NULL,
  exercise_id UUID        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id, variant_group)
);

COMMENT ON TABLE public.exercise_variant_assignments IS 'Records which A/B variant exercise each trainee was assigned to';

CREATE INDEX idx_variant_assignments_workshop ON public.exercise_variant_assignments (workshop_id);
CREATE INDEX idx_variant_assignments_trainee  ON public.exercise_variant_assignments (trainee_id);
