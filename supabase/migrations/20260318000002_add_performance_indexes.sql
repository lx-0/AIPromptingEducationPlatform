-- Performance indexes for common query patterns

-- submissions: time-based analytics (trend queries filter/order by submitted_at)
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at
  ON submissions (submitted_at DESC);

-- submissions: composite index for per-user per-exercise lookups (common in progress + history queries)
CREATE INDEX IF NOT EXISTS idx_submissions_exercise_trainee
  ON submissions (exercise_id, trainee_id);

-- enrollments: lookups by workshop (enrollment counts, roster queries)
CREATE INDEX IF NOT EXISTS idx_enrollments_workshop_id
  ON enrollments (workshop_id);

-- enrollments: lookups by trainee (dashboard progress queries)
CREATE INDEX IF NOT EXISTS idx_enrollments_trainee_id
  ON enrollments (trainee_id);

-- enrollments: composite for membership checks (workshop + trainee together is the most common predicate)
CREATE INDEX IF NOT EXISTS idx_enrollments_workshop_trainee
  ON enrollments (workshop_id, trainee_id);

-- scores: time-based ordering for analytics trends
CREATE INDEX IF NOT EXISTS idx_scores_scored_at
  ON scores (scored_at DESC);

-- workshops: instructor + status composite (dashboard instructor workshop list)
CREATE INDEX IF NOT EXISTS idx_workshops_instructor_status
  ON workshops (instructor_id, status);
