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

## Environment Variables

| Variable | Where used | Description |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + Server | Anon/public key for client-side queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS for admin operations in Route Handlers |

## Related Docs

- [`docs/schema.md`](schema.md) — Full database schema and RLS policies
- [`../docs/VISION.md`](../../docs/VISION.md) — Product vision and success metrics
- [`../docs/ROADMAP.md`](../../docs/ROADMAP.md) — Milestone plan (M1–M5)
