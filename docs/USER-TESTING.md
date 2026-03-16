# User Testing — AI Prompting Education Platform

> **Status**: Execution complete (heuristic + code walkthrough against M1 build). Live session testing pending live deployment.
> Last updated: 2026-03-16

---

## Test Objectives

1. Validate that the **workshop join flow** is discoverable and error-free for non-technical trainees.
2. Confirm that **exercise submission** is intuitive — trainees understand what to write and how to submit.
3. Assess whether **AI judge feedback** is comprehensible and actionable for both trainees and instructors.
4. Identify friction points that could undermine adoption in corporate workshop settings.
5. Verify that instructors can create and publish a workshop without needing product support.

### Research Questions

- Can a non-technical trainee join a workshop and submit their first prompt without assistance?
- Does the AI judge score feel fair and credible to trainees?
- Can an instructor set up a rubric-backed exercise in under 10 minutes?
- Do trainees understand how to improve after reading AI feedback?

---

## User Personas

### Persona 1 — Alex Chen (Independent AI Trainer)

| Attribute | Detail |
|-----------|--------|
| **Role** | Freelance AI/GenAI trainer; runs 2–4 paid corporate workshops/month |
| **Technical level** | High — comfortable with APIs, LLMs, prompt engineering |
| **Company size context** | Trains teams of 15–80 at mid-market companies |
| **Goals** | Deliver measurable, repeatable learning outcomes; reduce prep time; show ROI to clients |
| **Pain points** | Manual grading is time-consuming and inconsistent; clients demand proof of learning; existing tools (Google Forms, Notion) have no scoring |
| **Success metric** | Objective scores he can share in a client report; exercises he can reuse across cohorts |
| **Device / context** | MacBook Pro, fast Wi-Fi, runs sessions live with projected screen |
| **Key concern** | "Will the AI judge score fairly, or will it frustrate my trainees?" |

### Persona 2 — Diana Müller (Enterprise L&D Manager)

| Attribute | Detail |
|-----------|--------|
| **Role** | Learning & Development Manager at a 300-person financial services firm |
| **Technical level** | Medium — uses LMS platforms (Cornerstone, TalentLMS), not an engineer |
| **Goals** | Evaluate platform for a company-wide GenAI upskilling program; needs compliance-friendly, reportable outcomes |
| **Pain points** | Hard to prove ROI on soft-skills training; IT procurement blocks most SaaS tools; privacy concerns about employee data |
| **Success metric** | Can run a pilot with one team (10–15 people) and produce a completion + score report |
| **Device / context** | Windows laptop on corporate network, possible firewall restrictions |
| **Key concern** | "Is this secure enough for enterprise use, and can I show management a dashboard?" |

### Persona 3 — Sam Okafor (Trainee — Non-technical Knowledge Worker)

| Attribute | Detail |
|-----------|--------|
| **Role** | Marketing coordinator at a mid-size company; enrolled in an internal GenAI workshop |
| **Technical level** | Low — familiar with ChatGPT casually, no coding or API experience |
| **Goals** | Complete the workshop exercises, understand why their prompts scored well or poorly, improve for next session |
| **Pain points** | Intimidated by "AI" tools; unclear instructions cause anxiety; generic feedback ("be more specific") feels unhelpful |
| **Success metric** | Submits all exercises and understands at least one concrete way to improve |
| **Device / context** | Corporate Windows laptop, Chrome browser, slow corporate Wi-Fi |
| **Key concern** | "I don't know if I'm doing this right — will it tell me what I did wrong?" |

---

## Test Scenarios

### M1 Feature Coverage

| Feature | Scenarios |
|---------|-----------|
| Workshop join flow | SC-1, SC-2 |
| Exercise submission | SC-3, SC-4 |
| AI judge feedback | SC-5, SC-6 |
| Instructor setup | SC-7 |

### Scenario Table

| # | Scenario | Persona | Pre-conditions | Steps | Success Criteria | Failure Indicators |
|---|----------|---------|---------------|-------|------------------|--------------------|
| SC-1 | Join workshop via invite code | Sam (trainee) | Has received invite code via email; not yet signed up | 1. Open invite link or platform URL<br>2. Create account (trainee role)<br>3. Enter invite code<br>4. Land on workshop view | Account created; workshop visible within 3 steps; no error messages; < 3 min total | Account creation fails; invite code not accepted; blank screen after join |
| SC-2 | Join workshop without valid invite code | Sam (trainee) | Enters wrong/expired code | 1. Enter invalid invite code | Clear, human-readable error message; guidance on what to do next | Generic 500 error; no feedback; silent failure |
| SC-3 | Read instructions and submit a prompt | Sam (trainee) | Joined workshop; exercise is published | 1. Open exercise<br>2. Read instructions<br>3. Write prompt in text area<br>4. Submit | Trainee submits without asking for help; < 5 min from opening exercise; submission confirmed by UI | Trainee unsure where to type; no confirmation after submit; submit button not visible without scrolling |
| SC-4 | Re-submit / improve a prompt after feedback | Sam (trainee) | Has received AI feedback on first submission | 1. Read AI feedback<br>2. Edit or rewrite prompt<br>3. Submit again | Trainee can re-submit; sees new score vs. old score | Re-submit not possible; no version history; trainee cannot find the edit field |
| SC-5 | Review AI judge score and per-criterion feedback | Sam (trainee) | Has submitted a prompt; score has been generated | 1. Navigate to score view<br>2. Read overall score and per-criterion breakdown<br>3. Identify one area to improve | Trainee can state (unprompted) one concrete way to improve their prompt | Feedback uses jargon; scores seem arbitrary; trainee says "I don't understand what this means" |
| SC-6 | Instructor reviews trainee submissions and scores | Alex (trainer) | Workshop published; ≥1 trainee submission with score | 1. Log in as instructor<br>2. Navigate to submission list<br>3. Review score breakdown for one trainee | Instructor can see all submissions; per-criterion scores are visible; can export or copy results | Submissions list is empty; no way to differentiate trainees; no aggregate view |
| SC-7 | Create a workshop and add a rubric-backed exercise | Alex (trainer) | Has an instructor account | 1. Create new workshop<br>2. Add exercise title + instructions<br>3. Add rubric (2–3 criteria)<br>4. Publish workshop<br>5. Share invite code | Workshop created and published in < 10 min; invite code generated; at least one exercise visible to trainees | Rubric builder is confusing; publish button missing; invite code not visible after publish |

---

## Evaluation Criteria and Success Thresholds

### Task Completion Rates

| Scenario | Target Completion Rate | Minimum Acceptable |
|----------|----------------------|--------------------|
| SC-1 (Join workshop) | 95% | 85% |
| SC-3 (Submit prompt) | 90% | 80% |
| SC-5 (Understand feedback) | 80% | 70% |
| SC-7 (Instructor setup) | 90% | 75% |

### Time-on-Task Targets

| Task | Target | Max Acceptable |
|------|--------|---------------|
| Join workshop (SC-1) | < 3 min | 5 min |
| Submit first prompt (SC-3) | < 5 min | 8 min |
| Read and interpret feedback (SC-5) | < 2 min | 4 min |
| Create workshop + exercise (SC-7) | < 10 min | 15 min |

### Error Rate Targets

| Task | Max Acceptable Error Events |
|------|-----------------------------|
| Join workshop (SC-1) | ≤ 1 per session |
| Submit prompt (SC-3) | ≤ 1 per session |
| Rubric setup (SC-7) | ≤ 2 per session |

### Qualitative Success Indicators

- Trainees can describe AI feedback in their own words without prompting.
- Instructors do not request support during setup.
- Zero instances of "I didn't know I had submitted" (submission confirmation clarity).
- Trainees express confidence that the score reflects their actual effort.

---

## Findings

> Execution method: heuristic + code walkthrough against M1 build (2026-03-16). Live session testing pending deployment. SC-6 not tested — blocked on PROA-19 (instructor submissions UI).

### Scenario Results

| Scenario | Result | Notes |
|----------|--------|-------|
| SC-1 (Join via valid invite code) | **PASS** | Full flow implemented with auth redirect, loading state, and enrollment confirmation |
| SC-2 (Join with invalid invite code) | **PASS** | Returns clear "Invalid invite code" error with dashboard guidance |
| SC-3 (Submit first prompt) | **PARTIAL PASS** | Submission works and streaming response appears; no explicit "Submitted" confirmation UI |
| SC-4 (Re-submit after feedback) | **PARTIAL PASS** | Re-submission is possible (textarea stays editable) but no score history or comparison across attempts |
| SC-5 (Review AI judge feedback) | **PASS** | Score, per-criterion breakdown, and overall feedback rendered correctly |
| SC-6 (Instructor reviews submissions) | **BLOCKED** | API ready (`/api/workshops/[id]/submissions`); no web UI — awaiting PROA-19 |
| SC-7 (Create workshop + rubric exercise) | **FAIL** | APIs functional but zero instructor-facing web UI; cannot be tested by non-developer |

### Detailed Findings

| # | Finding | Severity | Scenario | Evidence | Recommendation |
|---|---------|----------|----------|----------|----------------|
| F-001 | No explicit submission confirmation after prompt submit | Major | SC-3 | `ExerciseClient.tsx` line 118–124 creates submission in state but no toast/banner is shown; streaming response section appears with header "Response" but no "Submission saved" message | Add success confirmation (banner or status line) after `setSubmission()` showing "Submitted ✓" with timestamp; prevents "did it work?" anxiety |
| F-002 | No submission history or score comparison across re-attempts | Major | SC-4 | State `submission` (line 48) and `score` (line 49) are overwritten on each new submit; `setSubmission(null)` (line 60) clears previous data; no attempt list rendered | Maintain `submissions[]` array in state; display attempt history with per-attempt score badges so trainees can see improvement |
| F-003 | Instructor workflow has no web UI (workshop creation, exercise builder, publish, invite code) | Critical | SC-7 | No instructor pages or routes exist in `/app`; APIs at `/api/workshops`, `/api/workshops/[id]/exercises`, `/api/workshops/[id]/publish` are functional but unreachable via web interface | Implement instructor pages: workshop list/create, exercise editor with guided rubric form, publish with invite code copy button |
| F-004 | Instructor submissions view missing | Major | SC-6 | API at `/app/api/workshops/[id]/submissions/route.ts` is implemented and authorised; no UI pages exist for instructor to view results | Tracked as PROA-19; implement submissions list and per-trainee score breakdown pages |
| F-005 | AI judge feedback plain-language quality unverified | Minor | SC-5 | `scorer.ts` lines 77–79: system prompt requests "constructive feedback" but does not prohibit jargon or enforce plain-language outputs; no runtime validation | Under audit in PROA-28; add explicit plain-language instruction to system prompt and validate comment readability |

---

## Heuristic Pre-Analysis (Planning Phase)

Based on the schema and feature design, the following heuristic risks have been identified prior to live testing:

| Heuristic | Risk Area | Severity Estimate | Notes |
|-----------|-----------|-------------------|-------|
| Visibility of system status | Submission confirmation | Major | Trainees need immediate feedback that their prompt was received and is being scored |
| Error prevention | Invite code entry | Major | Invalid codes should be caught early with clear guidance |
| Help & documentation | Exercise instructions | Major | Instructions field is freeform — instructors may write poor instructions; platform should provide a template or example |
| Recognition over recall | Rubric criteria | Minor | Instructors define rubric JSON; a guided form builder would reduce errors |
| User control & freedom | Re-submission | Major | If trainees cannot re-submit, they lose the learning loop that makes AI judging valuable |
| Match between system and real world | Score language | Major | Per-criterion feedback must use plain language, not ML/AI jargon |
| Flexibility | Instructor dashboard | Minor | Power users (Alex) will want aggregate views; the schema supports it but UI is unverified |

---

## Recommendations

_Updated post-execution (2026-03-16):_

1. **Add explicit submission confirmation** (F-001, Major) — after the streaming response completes, display a "Submission saved" status line with timestamp and ID. Prevents the "did it work?" anxiety loop that is especially pronounced for non-technical trainees (Sam persona).
2. **Maintain submission history with score comparison** (F-002, Major) — retain all attempts in a list with scores. Show delta (e.g., "↑ +2 pts vs. attempt 1") to close the learning loop. This is the core value proposition of AI-judged re-submission.
3. **Build instructor web UI — critical path** (F-003, Critical) — the entire instructor workflow (workshop creation, exercise builder with rubric form, publish, invite code display) is API-complete but has no web interface. This blocks any real-world usage. Guided rubric builder (form UI vs. raw JSON) should be prioritised.
4. **Instructor submissions view** (F-004, Major) — tracked as PROA-19. Required before SC-6 can be tested or deployed.
5. **Plain-language feedback** (F-005, Minor) — update AI judge system prompt to explicitly prohibit ML/AI jargon in criterion comments. Under audit as PROA-28.

---

## Follow-up Issues

| # | Title | Severity | Scenario | Status |
|---|-------|----------|----------|--------|
| F-001 | Submission confirmation UX | Major | SC-3 | Created (see PROA tracker) |
| F-002 | Submission history and score comparison | Major | SC-4 | Created (see PROA tracker) |
| F-003 | Instructor workshop creation + exercise builder UI | Critical | SC-7 | Created (see PROA tracker) |
| F-004 | Instructor submissions view (trainee results) | Major | SC-6 | PROA-19 (existing) |
| F-005 | AI judge feedback readability audit | Minor | SC-5 | PROA-28 (existing) |

---

## Execution Schedule

| Phase | Target Date | Status |
|-------|-------------|--------|
| Plan finalized | 2026-03-15 | ✓ Done |
| Heuristic + code walkthrough | 2026-03-16 | ✓ Done |
| Follow-up issues created | 2026-03-16 | ✓ Done |
| Live evaluation sessions (SC-1–SC-5, SC-7) | TBD | After deployment |
| SC-6 live testing | TBD | After PROA-19 ships |
| Final findings update | TBD | Within 2 days of live sessions |

---

_Generated by UX Researcher agent. Execute against live M1 build when available._
