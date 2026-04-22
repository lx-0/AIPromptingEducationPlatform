-- Migration: Add enrollments table
-- Fixes drift: this table was referenced in performance indexes migration
-- (20260318000002) but was never created in Supabase migrations.

CREATE TABLE IF NOT EXISTS public.enrollments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Trainees can see their own enrollments
CREATE POLICY "trainees_read_own_enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = trainee_id);

-- Instructors can see enrollments for their workshops
CREATE POLICY "instructors_read_workshop_enrollments"
  ON public.enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workshops
      WHERE workshops.id = enrollments.workshop_id
        AND workshops.instructor_id = auth.uid()
    )
  );

-- Trainees can enroll themselves
CREATE POLICY "trainees_insert_own_enrollment"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = trainee_id);

-- Trainees can unenroll themselves; instructors can remove anyone
CREATE POLICY "trainees_delete_own_enrollment"
  ON public.enrollments FOR DELETE
  USING (auth.uid() = trainee_id OR public.is_instructor());
