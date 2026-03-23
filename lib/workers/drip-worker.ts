import { Worker } from "bullmq";
import { getBullMQConnection } from "../redis";
import { sendDripDay3Email, sendDripDay7Email, sendReengagementEmail } from "../email";
import pool from "../db";
import { logger } from "../logger";
import { DRIP_QUEUE_NAME, type DripJobData } from "../queue";

let _worker: Worker<DripJobData> | null = null;

export function startDripWorker(): Worker<DripJobData> {
  if (_worker) return _worker;

  _worker = new Worker<DripJobData>(
    DRIP_QUEUE_NAME,
    async (job) => {
      const { userId, campaign } = job.data;
      logger.info("Drip email job started", { jobId: job.id, userId, campaign });

      // Load user
      const userResult = await pool.query<{
        email: string;
        display_name: string;
        email_opted_out: boolean;
      }>(
        `SELECT u.email, u.display_name,
                COALESCE(ep.marketing_emails, TRUE) = FALSE AS email_opted_out
         FROM users u
         LEFT JOIN email_preferences ep ON ep.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );
      const user = userResult.rows[0];
      if (!user || user.email_opted_out) {
        logger.info("Drip skipped — user missing or opted out", { userId, campaign });
        return;
      }

      // Idempotency: skip if already sent
      const alreadySent = await pool.query(
        `SELECT 1 FROM email_drip_sent WHERE user_id = $1 AND campaign = $2 LIMIT 1`,
        [userId, campaign]
      );
      if (alreadySent.rows.length > 0) {
        logger.info("Drip already sent, skipping", { userId, campaign });
        return;
      }

      // Send the right email
      if (campaign === "welcome_day3") {
        await sendDripDay3Email(user.email, user.display_name);
      } else if (campaign === "welcome_day7") {
        const subResult = await pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM submissions WHERE trainee_id = $1`,
          [userId]
        );
        const count = Number(subResult.rows[0]?.count ?? 0);
        await sendDripDay7Email(user.email, user.display_name, count);
      } else if (campaign === "reengagement_day14") {
        // Only send re-engagement if truly inactive (no submissions in 14 days)
        const recentActivity = await pool.query(
          `SELECT 1 FROM submissions
           WHERE trainee_id = $1 AND created_at > NOW() - INTERVAL '14 days'
           LIMIT 1`,
          [userId]
        );
        if (recentActivity.rows.length > 0) {
          logger.info("Re-engagement skipped — user is active", { userId });
          return;
        }
        await sendReengagementEmail(user.email, user.display_name);
      }

      // Record as sent
      await pool.query(
        `INSERT INTO email_drip_sent (user_id, campaign) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, campaign]
      );

      logger.info("Drip email sent", { userId, campaign });
    },
    {
      connection: getBullMQConnection(),
      concurrency: 5,
    }
  );

  _worker.on("failed", (job, err) => {
    logger.error("Drip job failed", {
      jobId: job?.id,
      campaign: job?.data?.campaign,
      error: err.message,
    });
  });

  logger.info("Drip email worker started");
  return _worker;
}
