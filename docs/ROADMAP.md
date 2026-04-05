# Roadmap — AI Prompting Education Platform

## Vision

An interactive web platform where instructors create prompt-engineering workshops and trainees learn by doing — writing prompts, getting AI-judged feedback, and improving iteratively.

## Completed Milestones

### M1 — Core Platform (done)

Database schema, auth (email/password), workshop/exercise CRUD API, exercise UI, prompt execution pipeline, AI judge scoring, workshop join flow with invite codes.

### M2 — Usability & Polish (done)

Trainee dashboard, progress tracking, score details, re-submission with history, submission confirmation, error boundaries, CSV export, rubric builder, analytics summary, instructor submissions view, user testing (SC-1 through SC-7), accessibility audit, feedback readability audit.

### M3 — Growth Features (done)

Instructor web UI (creation, publish, invite codes), marketing landing page, workshop discovery + search, testing infrastructure (Vitest + Playwright), mobile responsiveness, accessibility fixes, real-time score updates, instructor analytics dashboard, gamification (badges, streaks, leaderboard), dark mode polish, performance optimization, workshop templates.

### M4 — Monetization & Docs (done)

Stripe billing (checkout, portal, webhooks, free-tier enforcement), user documentation (instructor guide, trainee guide, FAQ, in-app help).

### M5 — Scale & Administration (done)

Email notifications, Google OAuth, deployment pipeline, database connection pooling, seed workshops, admin panel (user management, platform stats), workshop export/import, multi-LLM provider support (Anthropic, OpenAI, Google Gemini).

### M6 — Advanced Features (done)

Learning paths with prerequisites and progress tracking, advanced exercise types (multi-step, comparison, constrained), completion certificates with PDF generation, infrastructure hardening (caching, background jobs, observability), public workshop marketplace with ratings and reviews, collaboration features (discussions, peer review, activity feed), SEO optimization and social sharing with referral program, instructor power tools (cloning, import/export, scheduling, cohorts, grading overrides, announcements), enhanced analytics (funnels, cohort comparison, trainee reports, A/B variants, PDF export).

---

## Current Milestone

### M7 — Launch Quality & Hardening (in progress)

The platform is feature-rich. This milestone focuses on making it production-reliable.

| # | Issue | Priority | Description |
|---|-------|----------|-------------|
| 1 | Expand test coverage for critical paths | high | Add integration tests for billing, scoring, auth flows, marketplace, and admin routes. Target 80%+ coverage on critical paths. |
| 2 | Database migration system | high | Replace ad-hoc SQL with versioned migrations (node-pg-migrate). Enable safe schema changes across environments. |
| 3 | Security audit and hardening | high | CSRF protection, SQL injection review (raw queries), input validation on all API routes, rate limiting review. |
| 4 | Production error tracking | medium | Integrate Sentry (or equivalent) for runtime error capture, source maps, and alerting. |
| 5 | API documentation | medium | Generate OpenAPI spec for all API routes. Add Swagger UI at /api/docs. |
| 6 | Load testing and performance baseline | medium | Simulate concurrent scoring submissions. Identify bottlenecks in the LLM pipeline and database layer. |

### Success Criteria

- All critical API routes have integration test coverage
- Schema changes are versioned and reversible
- No high-severity findings in security review
- Production errors surface within 5 minutes via alerting
- API documentation is auto-generated and accurate

---

## Future Milestones

### M8 — Platform Intelligence

- AI-powered prompt improvement suggestions
- Automated difficulty calibration for exercises
- Personalized learning recommendations based on trainee history
- Instructor insights: which exercises produce the most learning gain

### M9 — Enterprise & Scale

- Team/organization accounts with SSO
- Custom branding for enterprise workshops
- Bulk enrollment and LMS integration (LTI)
- Multi-tenant data isolation
- SLA-backed uptime and support tiers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript 5) |
| Frontend | React 19, Tailwind CSS 4 |
| Auth | iron-session (email/password + Google OAuth) |
| Database | PostgreSQL via pg driver |
| Cache/Queue | Redis + BullMQ |
| LLM | Anthropic, OpenAI, Google Gemini |
| Payments | Stripe |
| Email | Resend |
| Testing | Vitest + Playwright |
| Deployment | Railway (Docker) |
