# AI Judge Feedback — Plain-Language Readability Audit

> **Issue**: PROA-28
> **Method**: Heuristic simulation + static analysis of `lib/scorer.ts` against representative rubric types (no live database at time of audit; deployment pending).
> **Auditor**: UX Researcher
> **Date**: 2026-03-16
> **Persona reference**: Sam Okafor — marketing coordinator, low technical level, casual ChatGPT user. Target: reads feedback and can state one concrete improvement unprompted.

---

## Summary

The current scorer prompt produces feedback that is **partially readable** but has a **systematic jargon risk**. The system prompt instructs the judge to behave as an "expert AI judge" with no plain-language constraint, no prohibition on technical terminology, and no requirement that comments be actionable. Representative simulations show that 4 of 6 criterion comments and the overall assessment would likely be unintelligible or non-actionable for a non-technical trainee. The overall assessment is the highest-risk field.

**Verdict: Prompt changes required.** Fixes are low-effort (system prompt additions only) and should be applied before live workshop deployment.

---

## Scorer Prompt Analysis

### Current System Prompt (`lib/scorer.ts` lines 77–79)

```
You are an expert AI judge evaluating trainee prompts for a prompting education platform.
Score each rubric criterion honestly and provide constructive feedback.
Respond ONLY with a valid JSON object — no markdown, no explanation outside JSON.
```

### Current User Prompt Key Phrases (`lib/scorer.ts` lines 81–102)

- `"comment": "<brief feedback>"` — "brief" may produce terse, unexplained one-liners.
- `"overall": "<one or two sentence overall assessment>"` — no constraint on vocabulary or audience.
- No instruction about audience (non-technical trainee), plain language, or actionability.

### Identified Prompt Gaps

| # | Gap | Risk |
|---|-----|------|
| G-1 | "Expert AI judge" framing encourages expert-register language | High — model adopts technical vocabulary to match the persona |
| G-2 | No instruction to avoid AI/ML terminology | High — terms like "hallucination," "context injection," "grounding" appear naturally |
| G-3 | "Brief feedback" for criterion comments produces terse, non-actionable output | Medium — comment may state what is wrong without saying how to fix it |
| G-4 | "Constructive feedback" is undefined — no audience specification | High — model cannot calibrate for a non-technical reader |
| G-5 | Overall assessment has no plain-language or concrete-improvement constraint | High — tends to produce compound, abstract sentences |

---

## Representative Sample Feedback (Simulated from Current Prompt)

The following samples represent realistic output the current prompt would generate for common rubric criteria. Each is assessed against the **Sam persona**: can she read this, understand what went wrong, and describe one concrete thing to do differently?

---

### Sample 1 — Criterion: Clarity (5/10 pts)

**Comment (current prompt output)**:
> "The prompt exhibits adequate syntactic clarity but lacks semantic precision. The intent is discernible but the scope remains ambiguous."

**Readability assessment**:

| Check | Result |
|-------|--------|
| Jargon present? | ✗ Yes — "syntactic clarity," "semantic precision," "discernible," "scope" (in technical sense) |
| Actionable? | ✗ No — tells the trainee something is ambiguous but not what to make clear |
| Sam can state one improvement? | ✗ No |
| Flesch-Kincaid estimated grade level | ~Grade 16 (college graduate) |

**Plain-language version**:
> "Your prompt clearly states what you want, but it's not specific enough about who the answer is for or how detailed it should be. Try adding a sentence like: 'Write this for a complete beginner' or 'Keep the answer under 200 words.'"

---

### Sample 2 — Criterion: Specificity (3/10 pts)

**Comment (current prompt output)**:
> "Specificity is insufficient. The prompt relies on implicit context without adequate operationalization of the desired output."

**Readability assessment**:

| Check | Result |
|-------|--------|
| Jargon present? | ✗ Yes — "operationalization," "implicit context" |
| Actionable? | ✗ No — no indication of what specific information to add |
| Sam can state one improvement? | ✗ No |
| Estimated grade level | ~Grade 18 (postgraduate) |

**Plain-language version**:
> "The prompt is too vague. The AI doesn't know what format you want, how long the answer should be, or who it's for. Add at least one of those details and your score will go up."

---

### Sample 3 — Criterion: Context-Setting (4/10 pts)

**Comment (current prompt output)**:
> "The system context is absent. The LLM lacks the necessary grounding information to produce a calibrated response."

**Readability assessment**:

| Check | Result |
|-------|--------|
| Jargon present? | ✗ Yes — "system context," "grounding information," "calibrated response," "LLM" |
| Actionable? | ✗ No |
| Sam can state one improvement? | ✗ No — "LLM" and "grounding" are opaque to non-technical users |
| Estimated grade level | ~Grade 17 |

**Plain-language version**:
> "You didn't give the AI any background about the situation. For example: 'I'm writing an email to my manager who doesn't know anything about this topic yet.' Background context helps the AI give you a more relevant answer."

---

### Sample 4 — Criterion: Output Format Specification (2/10 pts)

**Comment (current prompt output)**:
> "No output format constraints are specified. The prompt does not leverage structured output patterns which could improve response fidelity."

**Readability assessment**:

| Check | Result |
|-------|--------|
| Jargon present? | ✗ Yes — "output format constraints," "structured output patterns," "response fidelity" |
| Actionable? | ✗ No |
| Sam can state one improvement? | ✗ No |
| Estimated grade level | ~Grade 16 |

**Plain-language version**:
> "You didn't say what format you want the answer in. Do you want bullet points? A numbered list? A paragraph? Try ending your prompt with: 'Give me the answer as a bulleted list with 3–5 points.'"

---

### Sample 5 — Criterion: Role Assignment (7/10 pts)

**Comment (current prompt output)**:
> "Persona assignment is present and generally appropriate. Minor improvements in task alignment could reduce hallucination risk."

**Readability assessment**:

| Check | Result |
|-------|--------|
| Jargon present? | ~ Partial — "persona assignment," "task alignment," "hallucination risk" |
| Actionable? | ~ Partial — scored well, but "hallucination risk" may cause anxiety without context |
| Sam can state one improvement? | ~ Maybe — "hallucination" will likely confuse or alarm a non-technical user |
| Estimated grade level | ~Grade 14 |

**Plain-language version**:
> "Good — you told the AI what role to play. To get an even better result, make sure the role matches exactly what you're asking for. (e.g., if you're asking for marketing advice, say 'Act as an experienced marketing manager.')"

---

### Sample 6 — Overall Assessment (Lowest-scoring area)

**Overall comment (current prompt output)**:
> "This prompt demonstrates nascent prompting skills with adequate intentionality but requires iterative refinement across multiple dimensions to achieve optimal LLM performance. The trainee should focus on parameter specificity and context injection."

**Readability assessment**:

| Check | Result |
|-------|--------|
| Jargon present? | ✗ Yes — "nascent," "intentionality," "iterative refinement," "optimal LLM performance," "parameter specificity," "context injection" |
| Actionable? | ✗ No — "context injection" means nothing to Sam |
| Sam can state one improvement? | ✗ No |
| Estimated grade level | ~Grade 19 (beyond postgraduate) |
| Emotional impact risk | High — "nascent" (beginner) + abstract language → likely to feel discouraging without any clear path forward |

**Plain-language version**:
> "You're off to a good start — the goal is clear. To improve your score, try adding: (1) who the answer is for, (2) what format you want, and (3) any constraints (length, tone, expertise level). One strong re-submission could earn you 6–8 more points."

---

## Aggregate Readability Scores

| Sample | Criterion | Jargon-Free? | Actionable? | Non-Technical User Can Act? |
|--------|-----------|-------------|-------------|----------------------------|
| S-1 | Clarity | ✗ | ✗ | ✗ |
| S-2 | Specificity | ✗ | ✗ | ✗ |
| S-3 | Context-Setting | ✗ | ✗ | ✗ |
| S-4 | Output Format | ✗ | ✗ | ✗ |
| S-5 | Role Assignment | ~ | ~ | ~ |
| S-6 | Overall | ✗ | ✗ | ✗ |
| **Pass rate** | | **17%** | **17%** | **17%** |

> Target pass rate for SC-5 success: 80% (from USER-TESTING.md evaluation criteria).
> Current estimated pass rate: ~17%. **Gap: 63 percentage points.**

---

## Root Cause

The scorer prompt has a single-word mismatch between intent and output: the word **"expert"** in "You are an expert AI judge" conditions the model to write in expert register. This one word drives most of the jargon. Combined with the absence of any audience specification, the model defaults to technical ML vocabulary because that is what an "expert evaluating AI prompts" would use in expert-to-expert communication.

---

## Recommended Prompt Changes

### Change 1 — Reframe the persona (system prompt, line 77)

**Before:**
```
You are an expert AI judge evaluating trainee prompts for a prompting education platform.
```

**After:**
```
You are a friendly, encouraging coach evaluating trainee prompts for a prompting skills course.
Your students are non-technical professionals (marketers, managers, coordinators) learning to write better prompts.
Write all feedback in plain English — no AI/ML jargon. Never use terms like "context injection," "grounding," "hallucination," "LLM," "operationalization," or "semantic precision."
```

**Why**: Reframing from "expert judge" to "friendly coach" shifts the output register. Explicitly naming the audience (non-technical professionals) gives the model a calibration target. Listing banned terms prevents the most common jargon slippage.

---

### Change 2 — Require actionable criterion comments (user prompt, line 94–96)

**Before:**
```json
{ "criterion": "<name>", "score": <number>, "comment": "<brief feedback>" }
```

**After:**
```json
{ "criterion": "<name>", "score": <number>, "comment": "<plain-English feedback: one sentence explaining what was missing or good, plus one concrete suggestion the trainee can act on in their next attempt>" }
```

**Why**: The explicit structure (what was wrong + what to do) forces the model to produce actionable output rather than a diagnosis without a prescription. "Plain-English" is repeated here as a reinforcement constraint.

---

### Change 3 — Make the overall assessment motivating and specific (user prompt, line 97–98)

**Before:**
```
"overall": "<one or two sentence overall assessment>"
```

**After:**
```
"overall": "<one to two sentences: start with what the trainee did well, then name the single most impactful change they could make to improve their score. Write in plain English, as if speaking to a colleague who is not technical. Do not use AI/ML terminology.>"
```

**Why**: The "start with a positive" instruction reduces the discouragement risk for anxious trainees (Sam persona). The "single most impactful change" instruction prevents vague multi-dimensional advice. The "colleague who is not technical" framing reinforces the register shift.

---

### Change 4 — Add a rubric-context hint (user prompt, new line before Task section)

Insert before the `## Task` section:

```
## Audience
The trainee is a non-technical professional. They do not know what "LLM," "context window," "grounding," or "prompt engineering" mean.
Write all feedback as if explaining to a smart colleague who has never studied AI.
Use short sentences. Prefer concrete examples over abstract descriptions.
```

**Why**: Placing the audience context immediately before the task instruction maximises the probability that it conditions the output format. This is a belt-and-suspenders addition to Changes 1–3.

---

## Full Revised Prompt (Drop-in Replacement for `lib/scorer.ts`)

```typescript
const systemPrompt = `You are a friendly, encouraging coach evaluating trainee prompts for a prompting skills course.
Your students are non-technical professionals (marketers, managers, coordinators) learning to write better prompts.
Write all feedback in plain English — no AI/ML jargon. Never use terms like "context injection," "grounding," "hallucination," "LLM," "operationalization," or "semantic precision."
Respond ONLY with a valid JSON object — no markdown, no explanation outside JSON.`;

const userPrompt = `## Exercise Instructions
${row.instructions}

## Rubric
${rubricText}

## Trainee Prompt
${row.prompt_text}

## LLM Response to the Trainee Prompt
${row.llm_response ?? "(no response)"}

## Audience
The trainee is a non-technical professional. They do not know what "LLM," "context window," "grounding," or "prompt engineering" mean.
Write all feedback as if explaining to a smart colleague who has never studied AI.
Use short sentences. Prefer concrete examples over abstract descriptions.

## Task
Score the trainee prompt against each rubric criterion. Return a JSON object with this exact shape:
{
  "criteria": [
    { "criterion": "<name>", "score": <number>, "comment": "<plain-English feedback: one sentence explaining what was missing or good, plus one concrete suggestion the trainee can act on in their next attempt>" }
  ],
  "overall": "<one to two sentences: start with what the trainee did well, then name the single most impactful change they could make to improve their score. Write in plain English, as if speaking to a colleague who is not technical. Do not use AI/ML terminology.>"
}

Score each criterion from 0 to its max points. Be fair but rigorous.`;
```

---

## Expected Impact of Changes

| Metric | Before (estimated) | After (projected) |
|--------|-------------------|-------------------|
| Jargon-free criterion comments | ~17% | ~85% |
| Actionable criterion comments | ~17% | ~80% |
| Non-technical user can state improvement | ~17% | ~75% |
| SC-5 target pass rate | 80% | Within range |

The changes are prompt-only — no code changes, no schema changes, no deployment risk. They can be applied in a single PR to `lib/scorer.ts`.

---

## Risks and Limitations

1. **Simulated samples only**: This audit uses heuristic simulation, not live database queries, because the platform is pre-deployment. Estimates should be validated against real submissions once live.
2. **Banned-term list may be incomplete**: New jargon terms may emerge in real outputs. Recommend periodic spot-checks of live scores (monthly) and an ongoing list of terms to block.
3. **Over-simplification risk**: Forcing plain language could occasionally produce feedback that lacks precision for technically advanced trainees. If the platform adds a "technical mode" for advanced learners, the system prompt should be parameterized by audience level.
4. **Model variance**: Haiku (claude-haiku-4-5-20251001) may not consistently follow all constraints under high load or edge-case rubrics. Recommend a manual review pass during the first two live workshops.

---

## Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| A-1 | Apply revised system prompt and user prompt in `lib/scorer.ts` | Engineer | High |
| A-2 | Spot-check 10 real scores after first live workshop; verify jargon-free output | UX Researcher | High |
| A-3 | Add "actionable feedback" to the UI label for criterion comments (e.g., change label from blank to "How to improve") | Engineer | Medium |
| A-4 | Consider adding a tooltip on the score section: "Scores are from our AI coach. Re-submit anytime to improve." | Engineer | Low |

---

_Audit by UX Researcher. Validated against `lib/scorer.ts` (commit d108e92 era). Live re-validation required post-deployment._
