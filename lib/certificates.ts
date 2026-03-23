import pool from "@/lib/db";
import crypto from "crypto";

/** Minimum score percentage per exercise to pass (0–1). */
const PASSING_THRESHOLD = 0.6;

export type Certificate = {
  id: string;
  trainee_id: string;
  workshop_id: string | null;
  path_id: string | null;
  type: "workshop" | "learning_path";
  issued_at: string;
  verification_code: string;
  trainee_name: string;
  entity_title: string;
  instructor_name: string;
  total_score: number;
  max_score: number;
  exercise_count: number;
};

function generateVerificationCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

// ---------------------------------------------------------------------------
// Auto-issue workshop certificate
// ---------------------------------------------------------------------------

/**
 * Called after a submission is scored.  Issues a workshop certificate if:
 *   - Every exercise in the workshop has been scored, AND
 *   - The best score for every exercise meets PASSING_THRESHOLD, AND
 *   - No certificate has been issued yet for this trainee+workshop.
 *
 * Returns the new certificate, or null when conditions aren't met / already issued.
 */
export async function maybeIssueWorkshopCertificate(
  traineeId: string,
  workshopId: string
): Promise<Certificate | null> {
  // Idempotency: skip if already issued
  const existing = await pool.query(
    "SELECT id FROM certificates WHERE trainee_id = $1 AND workshop_id = $2",
    [traineeId, workshopId]
  );
  if (existing.rows.length > 0) return null;

  // Check all exercises: each needs a best score >= PASSING_THRESHOLD
  const result = await pool.query<{
    total_exercises: string;
    passing_exercises: string;
    total_score: string;
    max_score: string;
  }>(
    `SELECT
       COUNT(DISTINCT e.id)::text                                             AS total_exercises,
       COUNT(DISTINCT CASE
         WHEN best.max_score > 0
           AND (best.total_score::numeric / best.max_score) >= $3
         THEN e.id END)::text                                                 AS passing_exercises,
       COALESCE(SUM(best.total_score), 0)::text                              AS total_score,
       COALESCE(SUM(best.max_score), 0)::text                                AS max_score
     FROM exercises e
     LEFT JOIN LATERAL (
       SELECT sc.total_score, sc.max_score
       FROM   submissions s
       JOIN   scores sc ON sc.submission_id = s.id
       WHERE  s.exercise_id = e.id AND s.trainee_id = $2
       ORDER  BY sc.total_score DESC
       LIMIT  1
     ) best ON true
     WHERE e.workshop_id = $1`,
    [workshopId, traineeId, PASSING_THRESHOLD]
  );

  const row = result.rows[0];
  if (!row) return null;

  const total = parseInt(row.total_exercises, 10);
  const passing = parseInt(row.passing_exercises, 10);

  if (total === 0 || passing < total) return null;

  // Fetch workshop + instructor details
  const workshopResult = await pool.query<{
    title: string;
    instructor_name: string;
  }>(
    `SELECT w.title, u.display_name AS instructor_name
     FROM   workshops w
     JOIN   users u ON u.id = w.instructor_id
     WHERE  w.id = $1`,
    [workshopId]
  );
  if (workshopResult.rows.length === 0) return null;

  // Fetch trainee display name
  const traineeResult = await pool.query<{ display_name: string }>(
    "SELECT display_name FROM users WHERE id = $1",
    [traineeId]
  );
  if (traineeResult.rows.length === 0) return null;

  const cert = await pool.query<Certificate>(
    `INSERT INTO certificates
       (trainee_id, workshop_id, type, verification_code,
        trainee_name, entity_title, instructor_name,
        total_score, max_score, exercise_count)
     VALUES ($1, $2, 'workshop', $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [
      traineeId,
      workshopId,
      generateVerificationCode(),
      traineeResult.rows[0].display_name,
      workshopResult.rows[0].title,
      workshopResult.rows[0].instructor_name,
      parseInt(row.total_score, 10),
      parseInt(row.max_score, 10),
      total,
    ]
  );

  return cert.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Auto-issue learning path certificate
// ---------------------------------------------------------------------------

/**
 * After a workshop certificate is issued, check all enrolled learning paths.
 * If every workshop in a path now has a certificate for this trainee, issue a
 * path-level certificate.
 *
 * Returns the list of newly issued path certificates (usually 0 or 1).
 */
export async function maybeIssueLearningPathCertificates(
  traineeId: string
): Promise<Certificate[]> {
  const pathsResult = await pool.query<{ path_id: string }>(
    "SELECT path_id FROM learning_path_enrollments WHERE trainee_id = $1",
    [traineeId]
  );

  const issued: Certificate[] = [];

  for (const { path_id } of pathsResult.rows) {
    // Idempotency check
    const existing = await pool.query(
      "SELECT id FROM certificates WHERE trainee_id = $1 AND path_id = $2",
      [traineeId, path_id]
    );
    if (existing.rows.length > 0) continue;

    // All workshops in the path must have workshop certificates for this trainee
    const checkResult = await pool.query<{
      total_workshops: string;
      certified_workshops: string;
    }>(
      `SELECT
         COUNT(DISTINCT lpw.workshop_id)::text AS total_workshops,
         COUNT(DISTINCT c.workshop_id)::text   AS certified_workshops
       FROM   learning_path_workshops lpw
       LEFT   JOIN certificates c
                ON c.workshop_id = lpw.workshop_id
               AND c.trainee_id  = $2
               AND c.type        = 'workshop'
       WHERE  lpw.path_id = $1`,
      [path_id, traineeId]
    );

    const row = checkResult.rows[0];
    if (!row) continue;

    const total = parseInt(row.total_workshops, 10);
    const certified = parseInt(row.certified_workshops, 10);
    if (total === 0 || certified < total) continue;

    // Fetch path + instructor details
    const pathResult = await pool.query<{
      title: string;
      instructor_name: string;
    }>(
      `SELECT lp.title, u.display_name AS instructor_name
       FROM   learning_paths lp
       JOIN   users u ON u.id = lp.instructor_id
       WHERE  lp.id = $1`,
      [path_id]
    );
    if (pathResult.rows.length === 0) continue;

    const traineeResult = await pool.query<{ display_name: string }>(
      "SELECT display_name FROM users WHERE id = $1",
      [traineeId]
    );
    if (traineeResult.rows.length === 0) continue;

    const cert = await pool.query<Certificate>(
      `INSERT INTO certificates
         (trainee_id, path_id, type, verification_code,
          trainee_name, entity_title, instructor_name,
          total_score, max_score, exercise_count)
       VALUES ($1, $2, 'learning_path', $3, $4, $5, $6, 0, 0, $7)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [
        traineeId,
        path_id,
        generateVerificationCode(),
        traineeResult.rows[0].display_name,
        pathResult.rows[0].title,
        pathResult.rows[0].instructor_name,
        total, // workshop count as exercise_count for path certificates
      ]
    );

    if (cert.rows[0]) issued.push(cert.rows[0]);
  }

  return issued;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getCertificateByCode(
  code: string
): Promise<Certificate | null> {
  const result = await pool.query<Certificate>(
    "SELECT * FROM certificates WHERE verification_code = $1",
    [code]
  );
  return result.rows[0] ?? null;
}

export async function getTraineeCertificates(
  traineeId: string
): Promise<Certificate[]> {
  const result = await pool.query<Certificate>(
    "SELECT * FROM certificates WHERE trainee_id = $1 ORDER BY issued_at DESC",
    [traineeId]
  );
  return result.rows;
}
