# Monitoring

## Observability Strategy

The AI Prompting Education Platform is a Next.js application backed by PostgreSQL. The critical paths are:

- **Auth flow** — sign-up, sign-in, session validation
- **Workshop browsing** — listing and viewing workshops/exercises
- **Prompt submission pipeline** — exercise submissions evaluated by the AI judge
- **Workshop join flow** — invite-code redemption

"Healthy" means: the database is reachable, all API routes return expected status codes, and AI judge scoring completes within 30 s.

Known failure modes:
- PostgreSQL connection pool exhaustion under load
- Anthropic API timeouts or rate-limiting during prompt scoring
- Iron-session secret misconfiguration locking all users out

## Health Checks

| Endpoint | Interval | Expected Response |
|----------|----------|-------------------|
| `GET /api/health` | 30 s | `200 OK` with `{"status":"ok"}` |

The health endpoint performs a lightweight `SELECT 1` against the connection pool and reports `503 Degraded` if the database is unreachable. Add it to your uptime monitor (e.g., UptimeRobot, Checkly, or a simple cron job).

## Error Tracking

Errors are logged to stdout as structured JSON (see **Logging** below). In production, pipe stdout to a log aggregator (e.g., Datadog, Logtail, or CloudWatch Logs) and set up a saved search or alert on `level:error`.

Triage flow:
1. Alert fires → search logs by `correlationId` to reconstruct the request.
2. Group repeated errors by `message` field.
3. Resolve at the root cause; add regression tests before deploying a fix.

No external error-tracking service is currently configured. If error volume grows, integrate Sentry (`@sentry/nextjs`) by wrapping `instrumentation.ts` and passing the DSN via `SENTRY_DSN`.

## Logging

All application logs are written via `lib/logger.ts` as structured JSON to stdout:

```json
{
  "timestamp": "2026-03-16T04:00:00.000Z",
  "level": "info",
  "service": "ai-prompting-education-platform",
  "correlationId": "req-abc123",
  "message": "Submission scored",
  "workshopId": "ws-42",
  "exerciseId": "ex-7",
  "score": 88
}
```

Required fields on every log line:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 | When the event occurred |
| `level` | `debug\|info\|warn\|error` | Severity |
| `service` | string | Always `ai-prompting-education-platform` |
| `message` | string | Human-readable description |

Optional but encouraged:

| Field | Description |
|-------|-------------|
| `correlationId` | Request or trace ID for linking related entries |
| `userId` | Authenticated user (never log passwords or secrets) |
| `workshopId` / `exerciseId` | Domain identifiers for filtering |
| `latencyMs` | Duration of an operation |
| `error` | Error message string (not full stack unless `debug` level) |

Log levels:
- `debug` — local development only; do not enable in production
- `info` — normal operations (sign-in, submission, health checks)
- `warn` — recoverable anomalies (deprecated endpoint used, slow query)
- `error` — actionable failures requiring investigation

## Alerting Rules

| Metric | Threshold | Action |
|--------|-----------|--------|
| Health check failure | 3 consecutive failures | Page on-call engineer |
| Error rate | > 1 % of requests over 5 min | Notify on-call engineer |
| AI judge latency (P95) | > 30 s over 5 min | Notify on-call engineer |
| Database connection errors | Any in production | Page on-call engineer |

Configure alerts in your uptime monitor or log aggregation tool. For a zero-infrastructure approach, run `curl https://your-domain/api/health` from a cron job and send an email on non-200 responses.

## Dashboards

- **API Health** — uptime, health check pass/fail rate, response time
- **Application Errors** — error log rate by `message`, grouped by hour
- **Submission Pipeline** — submission count, AI judge latency (P50/P95), score distribution
- **Auth** — sign-in success/failure rate, active sessions

Until a dedicated dashboard tool is set up, filter structured logs by `level` and `message` in your log aggregator to approximate these views.
