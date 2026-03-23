-- Migration: Add learning paths and curricula (M7.3)

-- ============================================================
-- learning_paths
-- Instructors create structured journeys spanning multiple workshops.
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_paths (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  instructor_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published', 'archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_instructor_id ON learning_paths (instructor_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status        ON learning_paths (status);
CREATE INDEX IF NOT EXISTS idx_learning_paths_instructor_status
  ON learning_paths (instructor_id, status);

-- ============================================================
-- learning_path_workshops
-- Ordered list of workshops within a path, with optional prerequisites.
-- prerequisite_workshop_id: the workshop that must be completed before
-- this row's workshop is unlocked for the trainee.
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_path_workshops (
  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id                  UUID    NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  workshop_id              UUID    NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  sort_order               INTEGER NOT NULL DEFAULT 0,
  prerequisite_workshop_id UUID    REFERENCES workshops(id) ON DELETE SET NULL,
  UNIQUE (path_id, workshop_id)
);

CREATE INDEX IF NOT EXISTS idx_lpw_path_id      ON learning_path_workshops (path_id);
CREATE INDEX IF NOT EXISTS idx_lpw_workshop_id  ON learning_path_workshops (workshop_id);
CREATE INDEX IF NOT EXISTS idx_lpw_path_order   ON learning_path_workshops (path_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lpw_prereq       ON learning_path_workshops (prerequisite_workshop_id)
  WHERE prerequisite_workshop_id IS NOT NULL;

-- ============================================================
-- learning_path_enrollments
-- Tracks which trainees are enrolled in which paths.
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_path_enrollments (
  path_id     UUID        NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (path_id, trainee_id)
);

CREATE INDEX IF NOT EXISTS idx_lpe_trainee_id ON learning_path_enrollments (trainee_id);
