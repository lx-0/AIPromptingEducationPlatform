import pool from "@/lib/db";

// ---------------------------------------------------------------------------
// Badge type registry
// ---------------------------------------------------------------------------

export type BadgeType =
  | "first_submission"
  | "perfect_score"
  | "workshop_complete"
  | "streak_3"
  | "streak_7";

export type BadgeMeta = {
  type: BadgeType;
  label: string;
  description: string;
  emoji: string;
};

export const BADGE_CATALOG: Record<BadgeType, BadgeMeta> = {
  first_submission: {
    type: "first_submission",
    label: "First Step",
    description: "Made your very first submission",
    emoji: "🚀",
  },
  perfect_score: {
    type: "perfect_score",
    label: "Perfect Score",
    description: "Achieved 100% on an exercise",
    emoji: "💯",
  },
  workshop_complete: {
    type: "workshop_complete",
    label: "Workshop Complete",
    description: "Completed every exercise in a workshop",
    emoji: "🏆",
  },
  streak_3: {
    type: "streak_3",
    label: "3-Day Streak",
    description: "Submitted prompts on 3 consecutive days",
    emoji: "🔥",
  },
  streak_7: {
    type: "streak_7",
    label: "7-Day Streak",
    description: "Submitted prompts on 7 consecutive days",
    emoji: "⚡",
  },
};

// ---------------------------------------------------------------------------
// Streak management
// ---------------------------------------------------------------------------

/**
 * Updates the trainee's streak based on today's date.
 * Returns the updated current streak value.
 */
export async function updateStreak(traineeId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const existing = await pool.query<{
    current_streak: number;
    longest_streak: number;
    last_sub_date: string | null;
  }>(
    "SELECT current_streak, longest_streak, last_sub_date FROM streaks WHERE trainee_id = $1",
    [traineeId]
  );

  if (existing.rows.length === 0) {
    // First ever submission
    await pool.query(
      `INSERT INTO streaks (trainee_id, current_streak, longest_streak, last_sub_date)
       VALUES ($1, 1, 1, $2)`,
      [traineeId, today]
    );
    return 1;
  }

  const row = existing.rows[0];
  const lastDate = row.last_sub_date;

  if (lastDate === today) {
    // Already submitted today — streak unchanged
    return row.current_streak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak: number;
  if (lastDate === yesterdayStr) {
    // Consecutive day — extend streak
    newStreak = row.current_streak + 1;
  } else {
    // Broke the streak — reset
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, row.longest_streak);

  await pool.query(
    `UPDATE streaks
     SET current_streak = $2, longest_streak = $3, last_sub_date = $4, updated_at = NOW()
     WHERE trainee_id = $1`,
    [traineeId, newStreak, newLongest, today]
  );

  return newStreak;
}

// ---------------------------------------------------------------------------
// Badge award logic
// ---------------------------------------------------------------------------

/**
 * Checks conditions and awards any newly earned badges.
 * Returns the list of newly awarded BadgeMeta (empty if none).
 */
export async function checkAndAwardBadges(
  traineeId: string,
  submissionId: string,
  scorePct: number,         // 0-100
  currentStreak: number
): Promise<BadgeMeta[]> {
  // Load already-earned badges to avoid duplicates
  const alreadyEarned = await pool.query<{ badge_type: string }>(
    "SELECT badge_type FROM user_badges WHERE trainee_id = $1",
    [traineeId]
  );
  const earned = new Set(alreadyEarned.rows.map((r) => r.badge_type));

  const toAward: BadgeType[] = [];

  // --- first_submission ---
  if (!earned.has("first_submission")) {
    const countResult = await pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM submissions WHERE trainee_id = $1",
      [traineeId]
    );
    if (parseInt(countResult.rows[0].count, 10) >= 1) {
      toAward.push("first_submission");
    }
  }

  // --- perfect_score ---
  if (!earned.has("perfect_score") && scorePct === 100) {
    toAward.push("perfect_score");
  }

  // --- streak_3 ---
  if (!earned.has("streak_3") && currentStreak >= 3) {
    toAward.push("streak_3");
  }

  // --- streak_7 ---
  if (!earned.has("streak_7") && currentStreak >= 7) {
    toAward.push("streak_7");
  }

  // --- workshop_complete ---
  if (!earned.has("workshop_complete")) {
    // Find the workshop for this submission's exercise
    const workshopResult = await pool.query<{
      workshop_id: string;
      total_exercises: string;
      scored_exercises: string;
    }>(
      `SELECT
         ex.workshop_id,
         COUNT(DISTINCT ex.id)::text AS total_exercises,
         COUNT(DISTINCT s2.exercise_id)::text AS scored_exercises
       FROM submissions s
       JOIN exercises ex ON ex.id = s.exercise_id
       JOIN exercises ex2 ON ex2.workshop_id = ex.workshop_id
       LEFT JOIN submissions s2 ON s2.exercise_id = ex2.id
         AND s2.trainee_id = $1
         AND EXISTS (SELECT 1 FROM scores sc WHERE sc.submission_id = s2.id)
       WHERE s.id = $2
       GROUP BY ex.workshop_id`,
      [traineeId, submissionId]
    );
    if (workshopResult.rows.length > 0) {
      const row = workshopResult.rows[0];
      const total = parseInt(row.total_exercises, 10);
      const scored = parseInt(row.scored_exercises, 10);
      if (total > 0 && scored >= total) {
        toAward.push("workshop_complete");
      }
    }
  }

  if (toAward.length === 0) return [];

  // Insert new badges (ignore conflicts)
  for (const badgeType of toAward) {
    await pool.query(
      `INSERT INTO user_badges (trainee_id, badge_type)
       VALUES ($1, $2)
       ON CONFLICT (trainee_id, badge_type) DO NOTHING`,
      [traineeId, badgeType]
    );
  }

  return toAward.map((t) => BADGE_CATALOG[t]);
}
