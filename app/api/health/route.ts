import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latencyMs?: number; error?: string }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await pool.query("SELECT 1");
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      status: "error",
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "unknown",
    };
  }

  const healthy = Object.values(checks).every((c) => c.status === "ok");
  const status = healthy ? 200 : 503;

  if (!healthy) {
    logger.error("Health check failed", { checks });
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}
