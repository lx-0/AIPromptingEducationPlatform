import { Queue } from "bullmq";
import { createRedisConnection } from "./redis";

export type ScoringJobData = {
  submissionId: string;
  userId: string;
  exerciseTitle: string;
  exerciseId: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScoringQueue = Queue<ScoringJobData, any, string>;

const QUEUE_NAME = "scoring";

let _queue: ScoringQueue | null = null;

export function getScoringQueue(): ScoringQueue | null {
  if (!process.env.REDIS_URL) return null;
  if (!_queue) {
    _queue = new Queue(QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    }) as ScoringQueue;
  }
  return _queue;
}

export { QUEUE_NAME };

// ---------------------------------------------------------------------------
// Drip email queue
// ---------------------------------------------------------------------------

export type DripJobData = {
  userId: string;
  campaign: "welcome_day3" | "welcome_day7" | "reengagement_day14";
};

const DRIP_QUEUE_NAME = "drip-email";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DripQueue = Queue<DripJobData, any, string>;

let _dripQueue: DripQueue | null = null;

export function getDripQueue(): DripQueue | null {
  if (!process.env.REDIS_URL) return null;
  if (!_dripQueue) {
    _dripQueue = new Queue(DRIP_QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 100 },
      },
    }) as DripQueue;
  }
  return _dripQueue;
}

export { DRIP_QUEUE_NAME };

/** Schedule the welcome drip series for a newly registered user. */
export async function scheduleDripSeries(userId: string): Promise<void> {
  const queue = getDripQueue();
  if (!queue) return;

  const DAY_MS = 24 * 60 * 60 * 1000;

  await Promise.all([
    queue.add("drip", { userId, campaign: "welcome_day3" }, { delay: 3 * DAY_MS, jobId: `drip-day3-${userId}` }),
    queue.add("drip", { userId, campaign: "welcome_day7" }, { delay: 7 * DAY_MS, jobId: `drip-day7-${userId}` }),
  ]);
}

/** Schedule a re-engagement email (14-day inactivity). */
export async function scheduleReengagement(userId: string): Promise<void> {
  const queue = getDripQueue();
  if (!queue) return;

  const DAY_MS = 24 * 60 * 60 * 1000;
  await queue.add(
    "drip",
    { userId, campaign: "reengagement_day14" },
    { delay: 14 * DAY_MS, jobId: `drip-reengagement-${userId}` }
  );
}
