import pool from "@/lib/db";

/**
 * After a trainee submits to an exercise, check whether they've now completed
 * the parent workshop (all exercises submitted at least once).  If so, scan
 * all learning paths where that workshop is a prerequisite and auto-enroll the
 * trainee in the unlocked next workshop(s).
 *
 * "Completed" = at least one submission exists for every exercise in the workshop.
 */
export async function maybeAutoEnrollNextWorkshop(
  traineeId: string,
  exerciseId: string
): Promise<void> {
  // Resolve the workshop this exercise belongs to
  const exerciseResult = await pool.query<{ workshop_id: string }>(
    "SELECT workshop_id FROM exercises WHERE id = $1",
    [exerciseId]
  );

  if (exerciseResult.rows.length === 0) return;
  const workshopId = exerciseResult.rows[0].workshop_id;

  // Check if all exercises in the workshop have been submitted by this trainee
  const completionResult = await pool.query<{
    total_exercises: string;
    submitted_exercises: string;
  }>(
    `SELECT
       COUNT(DISTINCT e.id)::text AS total_exercises,
       COUNT(DISTINCT s.exercise_id)::text AS submitted_exercises
     FROM exercises e
     LEFT JOIN submissions s ON s.exercise_id = e.id AND s.trainee_id = $2
     WHERE e.workshop_id = $1`,
    [workshopId, traineeId]
  );

  const row = completionResult.rows[0];
  const total = parseInt(row.total_exercises, 10);
  const submitted = parseInt(row.submitted_exercises, 10);

  if (total === 0 || submitted < total) {
    // Workshop not yet completed — nothing to unlock
    return;
  }

  // Workshop is now completed. Find all path workshops where this workshop is a
  // prerequisite AND the trainee is enrolled in that path.
  const nextWorkshopsResult = await pool.query<{
    workshop_id: string;
    workshop_status: string;
  }>(
    `SELECT lpw.workshop_id, w.status AS workshop_status
     FROM learning_path_workshops lpw
     JOIN workshops w ON w.id = lpw.workshop_id
     JOIN learning_path_enrollments lpe
       ON lpe.path_id = lpw.path_id AND lpe.trainee_id = $2
     WHERE lpw.prerequisite_workshop_id = $1
       AND w.status = 'published'`,
    [workshopId, traineeId]
  );

  if (nextWorkshopsResult.rows.length === 0) return;

  // Auto-enroll trainee in each unlocked next workshop (idempotent)
  for (const { workshop_id } of nextWorkshopsResult.rows) {
    await pool.query(
      `INSERT INTO enrollments (workshop_id, trainee_id)
       VALUES ($1, $2)
       ON CONFLICT (workshop_id, trainee_id) DO NOTHING`,
      [workshop_id, traineeId]
    );
  }
}
