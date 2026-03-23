import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { pingRedis } from "@/lib/redis";
import { getScoringQueue } from "@/lib/queue";
import { logger } from "@/lib/logger";

type CheckResult = { status: "ok" | "error" | "disabled"; latencyMs?: number; error?: string; depth?: number };

export async function GET() {
  const checks: Record<string, CheckResult> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await pool.query("SELECT 1");
    checks.database = {
      status: "ok",
      latencyMs: Date.now() - dbStart,
    };
  } catch (err) {
    checks.database = {
      status: "error",
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "unknown",
    };
  }

  // Redis check
  if (process.env.REDIS_URL) {
    const { ok, latencyMs } = await pingRedis();
    checks.redis = ok
      ? { status: "ok", latencyMs }
      : { status: "error", latencyMs, error: "ping failed" };
  } else {
    checks.redis = { status: "disabled" };
  }

  // Queue depth check
  const queue = getScoringQueue();
  if (queue) {
    try {
      const counts = await queue.getJobCounts("waiting", "active", "failed");
      checks.scoringQueue = {
        status: "ok",
        depth: (counts.waiting ?? 0) + (counts.active ?? 0),
      };
    } catch (err) {
      checks.scoringQueue = {
        status: "error",
        error: err instanceof Error ? err.message : "unknown",
      };
    }
  } else {
    checks.scoringQueue = { status: "disabled" };
  }

  const healthy = Object.values(checks).every(
    (c) => c.status === "ok" || c.status === "disabled"
  );
  const httpStatus = healthy ? 200 : 503;

  if (!healthy) {
    logger.error("Health check failed", { checks });
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: httpStatus }
  );
}
