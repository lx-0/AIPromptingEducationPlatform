-- Migration: Add completion certificates (M7.5)

-- ============================================================
-- certificates
-- Issued when a trainee completes a workshop or learning path
-- with all exercises scored above the passing threshold.
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workshop_id       UUID        REFERENCES workshops(id) ON DELETE SET NULL,
  path_id           UUID        REFERENCES learning_paths(id) ON DELETE SET NULL,
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

-- One certificate per trainee per workshop
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_trainee_workshop
  ON certificates (trainee_id, workshop_id)
  WHERE workshop_id IS NOT NULL;

-- One certificate per trainee per learning path
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_trainee_path
  ON certificates (trainee_id, path_id)
  WHERE path_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_certificates_trainee_id        ON certificates (trainee_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates (verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_workshop_id       ON certificates (workshop_id);
CREATE INDEX IF NOT EXISTS idx_certificates_path_id           ON certificates (path_id);
