import { getRedis } from "./redis";

// Sliding-window rate limiter. Falls back to a simple in-memory map when Redis
// is not configured (development / test environments).
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowEnd = now + windowSeconds;

  const redis = getRedis();
  if (redis) {
    try {
      const redisKey = `rl:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, windowSeconds);
      }
      const ttl = await redis.ttl(redisKey);
      const resetAt = now + Math.max(ttl, 0);
      return {
        allowed: count <= maxRequests,
        remaining: Math.max(0, maxRequests - count),
        resetAt,
      };
    } catch {
      // Redis error — fail open so auth isn't broken by cache issues
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  if (!entry || now >= entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: windowEnd });
    return { allowed: true, remaining: maxRequests - 1, resetAt: windowEnd };
  }
  entry.count += 1;
  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

export function rateLimitHeaders(remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetAt),
  };
}
