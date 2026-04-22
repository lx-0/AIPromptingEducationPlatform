# Accessibility & Performance Audit — AI Prompting Education Platform

**Standard:** WCAG 2.2
**Date:** 2026-04-20
**Scope:** Core user flows — workshop list, exercise detail, submission flow
**Auditor:** UX Researcher (PROA-73)
**Prior audit:** 2026-03-16 (PROA-4)

---

## Executive Summary

Most Level A violations from the March 2026 audit have been remediated. However, **4 major new violations** and **5 minor issues** were found in this sweep. The estimated Lighthouse a11y score is **~80–85**, below the target of 90.

**Key regressions / new issues:**
- `maximum-scale=1` viewport blocks user zooming (WCAG 1.4.4) — affects all pages
- Search input in workshop list has no programmatic label (WCAG 1.3.1)
- Comparison exercise textareas have visual-only labels, not associated with inputs (WCAG 1.3.1)
- Difficulty filter buttons do not communicate selected state to assistive technology (WCAG 4.1.2)

Mobile responsiveness is good overall. Static asset caching is properly configured.

---

## What Was Fixed Since March 2026 ✅

| Issue (PROA-4) | Status |
|---|---|
| Skip-to-content link | Fixed — present in `app/layout.tsx` |
| Error messages missing `role="alert"` | Fixed — auth pages and ExerciseClient |
| Streaming response missing `aria-live` | Fixed — `aria-live="polite"` + `aria-busy` on response div |
| Loading states missing `aria-busy` | Fixed — submit buttons in ExerciseClient and auth |
| Textarea missing `aria-labelledby` | Fixed — `aria-labelledby="prompt-label"` in StandardClient |
| Card focus indicators missing | Fixed — `focus:ring-2 focus:ring-blue-500` on exercise list items |
| Nav elements missing `aria-label` | Fixed — all nav elements audited have `aria-label` |

---

## New Findings — April 2026

### F1. Viewport Blocks User Zoom — WCAG 1.4.4 (AA) ❌ **CRITICAL**

**Affected pages:** All pages

The generated HTML contains:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
```

`maximum-scale=1` prevents users from pinching-to-zoom, which is required by WCAG 1.4.4 (Resize Text). This blocks low-vision users who rely on viewport zoom.

The value is injected by Next.js when no explicit `viewport` export is defined in the root layout.

**Fix:** Add a `viewport` export to `app/layout.tsx`:
```typescript
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Do NOT set maximumScale — that overrides the Next.js default and removes the restriction
};
```

**Files:** `app/layout.tsx`

---

### F2. Search Input Missing Programmatic Label — WCAG 1.3.1 (A) ❌ **MAJOR**

**File:** `app/workshops/WorkshopDiscovery.tsx` (line 107–113)

The workshop search input uses only a `placeholder` attribute for labeling. Placeholder text is not a programmatic label — it disappears when the user types and is not reliably read by all screen readers.

```jsx
// Current — no label
<input
  type="search"
  placeholder="Search workshops…"
  ...
/>
```

**Fix:**
```jsx
<label htmlFor="workshop-search" className="sr-only">Search workshops</label>
<input
  id="workshop-search"
  type="search"
  placeholder="Search workshops…"
  ...
/>
```

Or use `aria-label`:
```jsx
<input
  type="search"
  aria-label="Search workshops"
  placeholder="Search workshops…"
  ...
/>
```

---

### F3. Comparison Exercise Labels Not Associated — WCAG 1.3.1 (A) ❌ **MAJOR**

**File:** `app/workshops/[id]/exercises/[exerciseId]/ExerciseClient.tsx` (lines 1327–1350)

The Prompt A and Prompt B textareas have visual `<label>` elements but they are not programmatically linked — no `htmlFor`/`id` pairing.

```jsx
// Current — visual label not linked
<label className="...">Prompt A</label>
<textarea value={promptA} ... />
```

Screen readers cannot associate the label with the field; the textarea is announced as "edit text" with no context.

**Fix:**
```jsx
<label htmlFor="prompt-a" className="...">Prompt A</label>
<textarea id="prompt-a" value={promptA} ... />

<label htmlFor="prompt-b" className="...">Prompt B</label>
<textarea id="prompt-b" value={promptB} ... />
```

---

### F4. Filter Buttons Don't Communicate Selected State — WCAG 4.1.2 (A) ❌ **MAJOR**

**File:** `app/workshops/WorkshopDiscovery.tsx` (lines 119–139)

The difficulty filter buttons (All / Beginner / Intermediate / Advanced) change appearance when active but never set `aria-pressed`. Screen reader users cannot determine which filter is currently active.

```jsx
// Current — no aria-pressed
<button onClick={() => setDifficultyFilter(level)} className={...}>
  {label}
</button>
```

**Fix:**
```jsx
<button
  onClick={() => setDifficultyFilter(level)}
  aria-pressed={difficultyFilter === level}
  className={...}
>
  {label}
</button>
```

---

### F5. Enroll Buttons Have Ambiguous Names — WCAG 2.4.6 (AA) ⚠️ **MAJOR**

**File:** `app/workshops/WorkshopDiscovery.tsx` (lines 234–239)

Each workshop card has an "Enroll" button. When navigating by button with a screen reader, all buttons are announced as "Enroll" with no workshop context. Screen readers cannot distinguish which workshop each button belongs to.

**Fix:**
```jsx
<button
  onClick={() => handleEnroll(workshop.id)}
  disabled={isLoading}
  aria-label={`Enroll in ${workshop.title}`}
  className="..."
>
  {isLoading ? "Enrolling…" : "Enroll"}
</button>
```

---

### F6. Multi-Step Textarea Missing Label — WCAG 2.4.6 (AA) ⚠️ **MINOR**

**File:** `ExerciseClient.tsx` — `MultiStepClient` component (line 1134)

The textarea in the multi-step exercise has only a `placeholder` attribute. No `aria-label` or `aria-labelledby` is present. (Compare: `StandardClient` correctly uses `aria-labelledby="prompt-label"`.)

**Fix:**
```jsx
<textarea
  aria-label={`Step ${currentStep + 1} prompt`}
  placeholder={`Write your prompt for step ${currentStep + 1}…`}
  ...
/>
```

---

### F7. Step Progress Indicator Lacks Screen Reader Description — WCAG 1.1.1 (A) ⚠️ **MINOR**

**File:** `ExerciseClient.tsx` — `MultiStepClient` (lines 1074–1100)

The multi-step progress dots are purely visual. A screen reader user receives no indication of which step they are on or how many steps exist.

**Fix:** Add `aria-label` to the progress container:
```jsx
<div
  className="flex items-center gap-2"
  role="group"
  aria-label={`Exercise progress: step ${currentStep + 1} of ${totalSteps}`}
>
  {steps.map((_, i) => (
    <div
      key={i}
      aria-label={i < currentStep ? `Step ${i + 1} complete` : i === currentStep ? `Step ${i + 1} current` : `Step ${i + 1}`}
      ...
    />
  ))}
</div>
```

---

### F8. LoadingSpinner SVG Missing aria-hidden — WCAG 1.1.1 (A) ⚠️ **MINOR**

**File:** `ExerciseClient.tsx` — `LoadingSpinner` component (lines 167–179)

The `LoadingSpinner` SVG does not have `aria-hidden="true"`. When rendered inside a section that already has loading state announced via `aria-busy`, the SVG is announced as unlabeled image, creating noise.

**Fix:**
```jsx
<svg
  className={`animate-spin ${className ?? "h-5 w-5"}`}
  aria-hidden="true"
  ...
>
```

---

### F9. Emoji in Link Text Without Context — WCAG 1.1.1 (A) ⚠️ **MINOR**

**File:** `app/workshops/[id]/page.tsx` (line 306)

```jsx
<Link href={`/workshops/${id}/leaderboard`}>
  🏆 Leaderboard
</Link>
```

The trophy emoji is read aloud by screen readers as "trophy emoji". This is tolerable but not ideal.

**Recommended fix:**
```jsx
<Link href={`/workshops/${id}/leaderboard`}>
  <span aria-hidden="true">🏆</span> Leaderboard
</Link>
```

---

## Performance Findings

| Area | Status | Notes |
|---|---|---|
| Static asset caching | ✅ Pass | `max-age=31536000, immutable` on `/_next/static/*` |
| Code splitting | ✅ Pass | Dynamic imports for `PublishPanel`, `DefaultProviderPanel`, `ReviewSection` |
| Server-side data fetching | ✅ Pass | Workshop data fetched in server components |
| Image caching | ✅ Pass | `max-age=86400` with stale-while-revalidate |
| Font loading | ✅ Pass | `next/font/google` with `subsets: ["latin"]` |
| Mobile font-size | ✅ Pass | `font-size: 16px` for all inputs on mobile (prevents iOS auto-zoom) |

No critical performance issues found. The main risk is the side-by-side response layout in `ComparisonClient` — on narrow viewports the 2-column grid collapses correctly (`grid-cols-1 sm:grid-cols-2`), so this is safe.

---

## Mobile Responsiveness

| Flow | Verdict | Notes |
|---|---|---|
| Workshop list | ✅ Pass | Single-column grid, filter chips wrap correctly |
| Workshop detail | ✅ Pass | Exercise list stacks correctly |
| Exercise submission (standard) | ✅ Pass | Textarea and button stack cleanly |
| Exercise submission (multi-step) | ✅ Pass | Step output and form sections stack correctly |
| Exercise submission (comparison) | ✅ Pass | Side-by-side collapses to single column on mobile |
| Auth sign-in/sign-up | ✅ Pass | Single-column forms with proper padding |

---

## Summary Scorecard

| Category | Score | Target |
|---|---|---|
| Lighthouse a11y (estimated) | ~80–85 | ≥ 90 |
| WCAG Level A violations | 5 (new) | 0 |
| WCAG Level AA violations | 2 (new) | 0 |
| Mobile responsiveness | Pass | Pass |
| Performance / caching | Pass | Pass |

**Verdict: FAILS** — 4 major violations prevent reaching the ≥ 90 Lighthouse a11y target.

---

## Remediation Priority

| # | Issue | Severity | Effort | WCAG |
|---|---|---|---|---|
| F1 | `maximum-scale=1` viewport | Critical | XS | 1.4.4 AA |
| F2 | Search input missing label | Major | XS | 1.3.1 A |
| F3 | Comparison textarea unlinked labels | Major | XS | 1.3.1 A |
| F4 | Filter buttons missing `aria-pressed` | Major | XS | 4.1.2 A |
| F5 | Enroll buttons ambiguous names | Major | XS | 2.4.6 AA |
| F6 | Multi-step textarea missing label | Minor | XS | 2.4.6 AA |
| F7 | Step progress no screen reader description | Minor | S | 1.1.1 A |
| F8 | LoadingSpinner SVG missing `aria-hidden` | Minor | XS | 1.1.1 A |
| F9 | Emoji in link text | Minor | XS | 1.1.1 A |

All F1–F5 are XS-effort fixes that should be batched into a single engineering PR.

---

## Related Issues

- PROA-4: March 2026 audit (mostly remediated)
- PROA-37, PROA-38, PROA-43: Previous a11y regressions
- PROA-73: This audit
- Follow-up: Remediation issue to be created
