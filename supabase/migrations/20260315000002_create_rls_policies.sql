-- Migration: Row-Level Security policies for all core tables
-- Assumes all tables created in migration 20260315000001

-- ============================================================
-- Helper: is the current user an instructor?
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'instructor'
  );
$$;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles policies
-- ============================================================

-- Users can read their own profile
CREATE POLICY "profiles: users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles: users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- workshops policies
-- ============================================================

-- Instructors can read their own workshops (including drafts)
CREATE POLICY "workshops: instructors can read own workshops"
  ON public.workshops FOR SELECT
  USING (instructor_id = auth.uid());

-- Trainees can read published workshops
CREATE POLICY "workshops: trainees can read published workshops"
  ON public.workshops FOR SELECT
  USING (status = 'published');

-- Instructors can create workshops (must own them)
CREATE POLICY "workshops: instructors can create workshops"
  ON public.workshops FOR INSERT
  WITH CHECK (instructor_id = auth.uid() AND public.is_instructor());

-- Instructors can update their own workshops
CREATE POLICY "workshops: instructors can update own workshops"
  ON public.workshops FOR UPDATE
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- Instructors can delete their own workshops
CREATE POLICY "workshops: instructors can delete own workshops"
  ON public.workshops FOR DELETE
  USING (instructor_id = auth.uid());

-- ============================================================
-- exercises policies
-- ============================================================

-- Instructors can read exercises for their workshops
CREATE POLICY "exercises: instructors can read own workshop exercises"
  ON public.exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workshops
      WHERE workshops.id = exercises.workshop_id
        AND workshops.instructor_id = auth.uid()
    )
  );

-- Trainees can read exercises from published workshops
CREATE POLICY "exercises: trainees can read published workshop exercises"
  ON public.exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workshops
      WHERE workshops.id = exercises.workshop_id
        AND workshops.status = 'published'
    )
  );

-- Instructors can create exercises for their workshops
CREATE POLICY "exercises: instructors can create exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (
    public.is_instructor() AND
    EXISTS (
      SELECT 1 FROM public.workshops
      WHERE workshops.id = exercises.workshop_id
        AND workshops.instructor_id = auth.uid()
    )
  );

-- Instructors can update exercises in their workshops
CREATE POLICY "exercises: instructors can update own workshop exercises"
  ON public.exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workshops
      WHERE workshops.id = exercises.workshop_id
        AND workshops.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workshops
      WHERE workshops.id = exercises.workshop_id
        AND workshops.instructor_id = auth.uid()
    )
  );

-- Instructors can delete exercises in their workshops
CREATE POLICY "exercises: instructors can delete own workshop exercises"
  ON public.exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workshops
      WHERE workshops.id = exercises.workshop_id
        AND workshops.instructor_id = auth.uid()
    )
  );

-- ============================================================
-- submissions policies
-- ============================================================

-- Trainees can read their own submissions
CREATE POLICY "submissions: trainees can read own submissions"
  ON public.submissions FOR SELECT
  USING (trainee_id = auth.uid());

-- Instructors can read all submissions for their workshops
CREATE POLICY "submissions: instructors can read workshop submissions"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercises
      JOIN public.workshops ON workshops.id = exercises.workshop_id
      WHERE exercises.id = submissions.exercise_id
        AND workshops.instructor_id = auth.uid()
    )
  );

-- Trainees can create submissions (must be their own)
CREATE POLICY "submissions: trainees can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (trainee_id = auth.uid());

-- ============================================================
-- scores policies
-- ============================================================

-- Trainees can read scores for their own submissions
CREATE POLICY "scores: trainees can read own scores"
  ON public.scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE submissions.id = scores.submission_id
        AND submissions.trainee_id = auth.uid()
    )
  );

-- Instructors can read scores for their workshops
CREATE POLICY "scores: instructors can read workshop scores"
  ON public.scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      JOIN public.exercises ON exercises.id = submissions.exercise_id
      JOIN public.workshops ON workshops.id = exercises.workshop_id
      WHERE submissions.id = scores.submission_id
        AND workshops.instructor_id = auth.uid()
    )
  );

-- Instructors can create scores for submissions in their workshops
CREATE POLICY "scores: instructors can create scores"
  ON public.scores FOR INSERT
  WITH CHECK (
    public.is_instructor() AND
    EXISTS (
      SELECT 1 FROM public.submissions
      JOIN public.exercises ON exercises.id = submissions.exercise_id
      JOIN public.workshops ON workshops.id = exercises.workshop_id
      WHERE submissions.id = scores.submission_id
        AND workshops.instructor_id = auth.uid()
    )
  );
