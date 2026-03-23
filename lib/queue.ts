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
