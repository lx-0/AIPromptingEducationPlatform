import Redis from "ioredis";
import { logger } from "./logger";

// Plain options for BullMQ connections (avoids ioredis version conflicts)
export function getBullMQConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not configured");
  return { url, maxRetriesPerRequest: null as null, enableReadyCheck: false };
}

// Alias kept for backward compat
export const createRedisConnection = getBullMQConnection;

// Singleton for general cache usage
let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    _redis.on("error", (err: Error) => {
      logger.error("Redis error", { error: err.message });
    });
  }
  return _redis;
}

export async function pingRedis(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  const redis = getRedis();
  if (!redis) return { ok: false, latencyMs: 0 };
  try {
    await redis.ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}
