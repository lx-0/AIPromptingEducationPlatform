import { Worker } from "bullmq";
import { getBullMQConnection } from "../redis";
import { scoreSubmission } from "../scorer";
import { updateStreak, checkAndAwardBadges } from "../badges";
import { sendScoreNotification } from "../email";
import pool from "../db";
import { logger } from "../logger";
import { QUEUE_NAME, type ScoringJobData } from "../queue";

let _worker: Worker<ScoringJobData> | null = null;

export function startScoringWorker(): Worker<ScoringJobData> {
  if (_worker) return _worker;

  _worker = new Worker<ScoringJobData>(
    QUEUE_NAME,
    async (job) => {
      const { submissionId, userId, exerciseTitle } = job.data;
      logger.info("Scoring job started", { jobId: job.id, submissionId });

      // 1. Score the submission (AI judge)
      const score = await scoreSubmission(submissionId);

      // 2. Gamification (streak + badges) — non-fatal
      let currentStreak = 0;
      try {
        currentStreak = await updateStreak(userId);
        const scorePct =
          score.max_score > 0
            ? Math.round((score.total_score / score.max_score) * 100)
            : 0;
        await checkAndAwardBadges(userId, submissionId, scorePct, currentStreak);
      } catch (err) {
        logger.warn("Gamification failed (non-fatal)", {
          submissionId,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // 3. Score notification email — non-fatal
      try {
        const userResult = await pool.query<{
          email: string;
          display_name: string;
          score_notify: boolean;
        }>(
          `SELECT u.email, u.display_name,
                  COALESCE(ep.score_notify, TRUE) AS score_notify
           FROM users u
           LEFT JOIN email_preferences ep ON ep.user_id = u.id
           WHERE u.id = $1`,
          [userId]
        );
        const row = userResult.rows[0];
        if (row?.score_notify) {
          const overall =
            typeof score.feedback?.overall === "string"
              ? score.feedback.overall
              : "";
          await sendScoreNotification(
            row.email,
            row.display_name,
            exerciseTitle,
            score.total_score,
            score.max_score,
            overall,
            submissionId
          );
        }
      } catch (err) {
        logger.warn("Score notification failed (non-fatal)", {
          submissionId,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      logger.info("Scoring job completed", { jobId: job.id, submissionId });
      return { score };
    },
    {
      connection: getBullMQConnection(),
      concurrency: 3,
    }
  );

  _worker.on("failed", (job, err) => {
    logger.error("Scoring job failed", {
      jobId: job?.id,
      submissionId: job?.data?.submissionId,
      error: err.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  logger.info("Scoring worker started", { concurrency: 3 });
  return _worker;
}
