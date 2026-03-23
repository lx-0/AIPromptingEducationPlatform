export async function register() {
  // Only run in Node.js server runtime, not Edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.REDIS_URL) {
      const { startScoringWorker } = await import("./lib/workers/scoring-worker");
      startScoringWorker();

      const { startDripWorker } = await import("./lib/workers/drip-worker");
      startDripWorker();
    }
  }
}
