# AI Prompting Education Platform

An interactive web platform for teaching AI prompting skills through hands-on exercises. Built for [PromptingSchool](https://promptingschool.com).

> **Vision**: Become the standard platform for hands-on AI prompting education — where professionals and teams learn to communicate effectively with AI through structured practice and measurable feedback. See [`docs/VISION.md`](../docs/VISION.md) and [`docs/ROADMAP.md`](../docs/ROADMAP.md) for full strategic context.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) with App Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Auth & Database | [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS) |
| Runtime | React 19 |

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project (free tier works)
- (Optional) [Supabase CLI](https://supabase.com/docs/guides/cli) for local development

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Supabase — find these in your project dashboard under Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>

# Service role key — used server-side only (never expose to the browser)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> **Where to find these values**: In the [Supabase dashboard](https://app.supabase.com), go to your project → **Settings** → **API**. Copy the **Project URL** and **anon public** key. The service role key is under the same page — keep it secret.

### 3. Apply database migrations

```bash
# With Supabase CLI (recommended)
supabase db push

# Or run each migration manually in the Supabase SQL editor:
# supabase/migrations/20260315000001_create_core_schema.sql
# supabase/migrations/20260315000002_create_rls_policies.sql
```

See [`docs/schema.md`](docs/schema.md) for full schema reference.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/                        # Next.js App Router
  layout.tsx                # Root layout (fonts, global styles)
  page.tsx                  # Home page
  globals.css               # Global CSS / Tailwind base
docs/
  schema.md                 # Database schema reference and ERD
supabase/
  migrations/               # SQL migration files (apply in order)
    20260315000001_create_core_schema.sql
    20260315000002_create_rls_policies.sql
public/                     # Static assets
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a full architecture overview.

## Architecture Overview

The platform is built on two main pillars:

**Next.js App Router (frontend + API)**
- Server Components for data fetching close to the database
- Route Handlers (`app/api/`) for REST endpoints consumed by client components
- Middleware for auth session validation on protected routes

**Supabase (backend)**
- PostgreSQL database with Row-Level Security (RLS) enforced at the DB level
- Supabase Auth for user sign-up / sign-in (email + OAuth)
- Realtime subscriptions (planned) for live exercise feedback

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full diagram and layer descriptions.

## Database

The schema supports two user roles: **instructors** (create workshops and exercises) and **trainees** (join workshops, submit prompts, receive scores).

Core tables: `profiles` → `workshops` → `exercises` → `submissions` → `scores`

Full schema: [`docs/schema.md`](docs/schema.md)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Development Notes

- **Auth is required** for all workshop and exercise routes. Unauthenticated users are redirected to sign-in by Next.js middleware.
- **RLS is enforced at the database layer** — even if API routes have bugs, Supabase won't leak data across users.
- **Environment variables prefixed `NEXT_PUBLIC_`** are exposed to the browser. Never put secrets there.
