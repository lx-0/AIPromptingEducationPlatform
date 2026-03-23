-- Migration: Advanced Exercise Types (M7.4)
-- Adds exercise_type, difficulty, constraints, and exercise_steps

-- Add exercise_type to exercises
ALTER TABLE public.exercises
  ADD COLUMN exercise_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (exercise_type IN ('standard', 'multi_step', 'comparison', 'constrained'));

-- Add difficulty tag
ALTER TABLE public.exercises
  ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));

-- Add constraints JSONB for constrained exercises
-- Shape: { "char_limit": 200, "forbidden_words": ["please"], "required_keywords": ["concise"] }
ALTER TABLE public.exercises
  ADD COLUMN constraints JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.exercises.exercise_type IS 'standard | multi_step | comparison | constrained';
COMMENT ON COLUMN public.exercises.difficulty IS 'beginner | intermediate | advanced';
COMMENT ON COLUMN public.exercises.constraints IS 'JSON: char_limit, forbidden_words[], required_keywords[] for constrained type';

-- ============================================================
-- exercise_steps
-- Steps for multi_step exercises; each step has its own
-- instructions and optional system_prompt.
-- ============================================================
CREATE TABLE public.exercise_steps (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id   UUID        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  step_number   INTEGER     NOT NULL,
  instructions  TEXT        NOT NULL,
  system_prompt TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_exercise_step UNIQUE (exercise_id, step_number)
);

COMMENT ON TABLE public.exercise_steps IS 'Steps for multi_step exercises; each step output feeds the next';

CREATE INDEX idx_exercise_steps_exercise_id ON public.exercise_steps (exercise_id);
CREATE INDEX idx_exercise_steps_order ON public.exercise_steps (exercise_id, step_number);

-- ============================================================
-- RLS for exercise_steps
-- ============================================================

-- Instructors can manage steps of their own exercises
CREATE POLICY "instructors_manage_steps"
  ON public.exercise_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exercises e
      JOIN public.workshops w ON w.id = e.workshop_id
      WHERE e.id = exercise_steps.exercise_id
        AND w.instructor_id = auth.uid()
    )
  );

-- Trainees (and instructors) can read steps of published workshops
CREATE POLICY "read_steps_published"
  ON public.exercise_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercises e
      JOIN public.workshops w ON w.id = e.workshop_id
      WHERE e.id = exercise_steps.exercise_id
        AND w.status = 'published'
    )
  );

-- Index for filtering exercises by difficulty on discovery pages
CREATE INDEX idx_exercises_difficulty ON public.exercises (difficulty);
CREATE INDEX idx_exercises_type ON public.exercises (exercise_type);
