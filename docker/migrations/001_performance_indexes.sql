-- Performance indexes for production hardening (PROA-57)
-- Run this against an existing database. init.sql already has these for new installs.

-- Composite index for rate-limiting query in execute route:
-- SELECT COUNT(*) FROM submissions WHERE trainee_id = $1 AND submitted_at > NOW() - INTERVAL '60 seconds'
CREATE INDEX IF NOT EXISTS idx_submissions_trainee_submitted
  ON submissions (trainee_id, submitted_at DESC);

-- Composite index for submission scoring lookups:
-- JOIN submissions + exercises for scorer.ts
CREATE INDEX IF NOT EXISTS idx_submissions_exercise_trainee
  ON submissions (exercise_id, trainee_id);

-- Index for leaderboard / analytics queries on scores
CREATE INDEX IF NOT EXISTS idx_scores_total_score
  ON scores (total_score DESC);

-- Partial index for active workshop queries
CREATE INDEX IF NOT EXISTS idx_workshops_published
  ON workshops (instructor_id, created_at DESC)
  WHERE status = 'published';
