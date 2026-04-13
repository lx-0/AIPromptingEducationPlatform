# Architecture — AI Prompting Education Platform

## Overview

The platform is a **Next.js 16 App Router** application backed by **Supabase** (PostgreSQL + Auth). It is designed around two user roles — **instructors** and **trainees** — with all data access enforced by Row-Level Security (RLS) policies at the database layer.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  React 19 Client Components + Tailwind CSS                  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────────────────┐
│                  Next.js 16 App Router                      │
│                                                             │
│  ┌──────────────────┐   ┌─────────────────────────────────┐ │
│  │ Server Components│   │ Route Handlers (app/api/)       │ │
│  │ (data fetching)  │   │ - /api/exercises                │ │
│  └──────────────────┘   │ - /api/submissions              │ │
│                         │ - /api/workshops                │ │
│  ┌──────────────────┐   └────────────────┬────────────────┘ │
│  │ Middleware        │                   │                  │
│  │ (auth guard on   │                   │                  │
│  │  protected routes│                   │                  │
│  └──────────────────┘                   │                  │
└────────────────────────────────────────-┼───────────────────┘
                                          │ Supabase JS SDK
┌─────────────────────────────────────────▼───────────────────┐
│                        Supabase                             │
│                                                             │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  Auth        │  │  PostgreSQL    │  │  Realtime      │  │
│  │  (JWT-based) │  │  + RLS         │  │  (planned)     │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                │
           ┌────────────────────┴─────────────────┐
           │          External LLM Providers       │
           │  Anthropic Claude / OpenAI GPT        │
           │  (prompt execution + AI judge scoring)│
           └───────────────────────────────────────┘
```

## Layer Descriptions

### Browser — React Client Components

Thin UI layer. Client components handle user interactions (form submission, navigation) and call Next.js Route Handlers for mutations. Server Components are used for initial data loads (workshop list, exercise details) to avoid client-side waterfalls.

### Next.js App Router

**Server Components** fetch data directly from Supabase using the service role client (server-side only). They render the initial HTML for exercises, workshops, and dashboards.

**Route Handlers** (`app/api/`) expose REST endpoints for mutations that require server-side logic:
- Prompt execution (send trainee prompt to LLM provider)
- AI judge scoring (evaluate response against rubric)
- Score persistence

**Middleware** runs on every request to protected routes. It validates the Supabase Auth session cookie and redirects unauthenticated users to `/sign-in`.

### Supabase

**Auth**: JWT-based session management using Supabase Auth. Users sign up with email/password (and optionally OAuth). On sign-up, a `profiles` row is auto-created via the `on_auth_user_created` trigger. The `role` field (`instructor` or `trainee`) is set from `user_metadata` at registration time.

**PostgreSQL + RLS**: All tables have RLS enabled. Security policies are defined at the DB layer — even if application code has a bug, cross-user data leaks are blocked by the database. See [`docs/schema.md`](schema.md) for the full policy table.

**Realtime** (planned): Supabase Realtime subscriptions will push live score updates to trainees without polling.

### External LLM Providers

Two LLM calls per submission:

1. **Prompt execution** — the trainee's prompt (+ optional system prompt from the exercise) is sent to the configured provider (Anthropic Claude or OpenAI GPT). The response is stored in `submissions.llm_response`.

2. **AI judge scoring** — a separate call evaluates the trainee's prompt and the LLM response against the exercise rubric. Returns a score and per-criterion feedback stored in `scores`.

The provider and model are configured per-exercise in `exercises.model_config` (see [`docs/schema.md`](schema.md)).

## Data Flow — Trainee Submits a Prompt

```
Trainee types prompt
        │
        ▼
POST /api/submissions
        │
        ├─► Validate session (middleware)
        │
        ├─► Fetch exercise (system prompt, model_config, rubric) from Supabase
        │
        ├─► Send [system_prompt + trainee_prompt] to LLM provider
        │       └─► Store llm_response in submissions table
        │
        ├─► Send [trainee_prompt + llm_response + rubric] to AI judge
        │       └─► Store score + feedback in scores table
        │
        └─► Return score + feedback to browser
```

## Auth Flow

```
User visits /dashboard (protected)
        │
        ▼
Middleware checks session cookie
        │
  ┌─────┴─────┐
  │ Valid?    │
  No          Yes
  │            └─► Render page
  ▼
Redirect to /sign-in
        │
User signs in via Supabase Auth
        │
Supabase sets session cookie
        │
Redirect back to /dashboard
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| RLS at DB layer | Security enforced independently of application code; protects against bugs or future regressions |
| Server Components for reads | Avoids client-side waterfall; data fetching happens close to the database |
| Route Handlers for mutations | LLM calls require server-side secrets; keeps API keys out of the browser |
| Per-exercise model config | Instructors can mix providers (Claude for execution, GPT for judging) within a single workshop |
| Invite-code workshop join | Low-friction access; no email approval flow needed for early beta |

## Database Migrations

Schema changes are managed with **[node-pg-migrate](https://github.com/salsita/node-pg-migrate)**. All migrations live in `migrations/` and are versioned sequentially.

### Workflow

| Command | What it does |
|---------|-------------|
| `npm run migrate:up` | Apply all pending migrations |
| `npm run migrate:down` | Roll back the last applied migration |
| `npm run migrate:create <name>` | Scaffold a new timestamped migration file |

Set `DATABASE_URL` before running any migration command:

```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/prompting_school
npm run migrate:up
```

### File format

Each file in `migrations/` is a `.sql` file with two sections separated by `-- Down Migration`:

```sql
-- Up migration SQL
CREATE TABLE example (...);

-- Down Migration
DROP TABLE IF EXISTS example;
```

### Where migrations run

| Environment | How |
|-------------|-----|
| Local dev | `npm run migrate:up` (manual, or via `docker-compose run migrate`) |
| CI (integration & e2e) | `npm run migrate:up` step in `qa.yml` before the test suite |
| Production (Railway) | `docker/entrypoint.sh` runs migrations automatically before the Next.js server starts |

### Adding a migration

```bash
# Creates migrations/{timestamp}_{name}.sql
npm run migrate:create add_new_column
# Edit the file: write UP SQL above "-- Down Migration", DOWN SQL below
npm run migrate:up
```

node-pg-migrate tracks applied migrations in a `pgmigrations` table. Running `migrate:up` is idempotent — already-applied migrations are skipped.

## Environment Variables

| Variable | Where used | Description |
|----------|-----------|-------------|
| `DATABASE_URL` | Server + migrations | PostgreSQL connection string |
| `SESSION_SECRET` | Server only | Secret for iron-session cookie signing (≥ 32 chars) |
| `ANTHROPIC_API_KEY` | Server only | Anthropic Claude API key for prompt execution and AI judge |
| `OPENAI_API_KEY` | Server only | OpenAI API key (optional, for OpenAI exercises) |
| `GOOGLE_API_KEY` | Server only | Google Generative AI key (optional, for Google exercises) |
| `STRIPE_SECRET_KEY` | Server only | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | Server only | Stripe webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser | Stripe publishable key |
| `RESEND_API_KEY` | Server only | Resend API key for transactional email |
| `EMAIL_FROM` | Server only | Sender address for transactional email |
| `NEXT_PUBLIC_APP_URL` | Browser + Server | Public base URL (e.g. `https://app.example.com`) |
| `GOOGLE_CLIENT_ID` | Server only | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Server only | Google OAuth client secret |

## Related Docs

- [`docs/schema.md`](schema.md) — Full database schema
- [`../docs/ROADMAP.md`](ROADMAP.md) — Milestone plan
