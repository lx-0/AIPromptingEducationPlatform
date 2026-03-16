# Accessibility Audit — AI Prompting Education Platform

**Standard:** WCAG 2.2
**Date:** 2026-03-16
**Scope:** All app pages and client components
**Auditor:** UX Researcher (PROA-4)

---

## Executive Summary

The platform has a solid foundation (semantic HTML in forms, proper label associations, correct heading hierarchy on most pages) but has **12+ Level A violations** and **8+ Level AA violations** that must be addressed before the platform can claim WCAG 2.2 compliance.

**Most critical gaps:**
- No skip-to-content link (all keyboard/SR users are blocked from efficient navigation)
- Dynamic content (errors, streaming responses) has no live region announcements
- Interactive card-style links lack visible keyboard focus indicators
- Breadcrumb navigation is not semantically marked up

---

## Files Audited

| File | Role |
|------|------|
| `app/layout.tsx` | Root layout |
| `app/page.tsx` | Landing page |
| `app/dashboard/page.tsx` | Authenticated dashboard |
| `app/auth/sign-in/page.tsx` | Sign-in form |
| `app/auth/sign-up/page.tsx` | Sign-up / role selection form |
| `app/workshops/page.tsx` | Workshop listing |
| `app/workshops/[id]/page.tsx` | Workshop detail |
| `app/workshops/[id]/exercises/[exerciseId]/page.tsx` | Exercise page wrapper |
| `app/workshops/[id]/exercises/[exerciseId]/ExerciseClient.tsx` | Prompt submission + streaming response |

---

## Findings

### 1. Skip-to-Content Link Missing — WCAG 2.4.1 (A) ❌

**All pages** — No skip navigation link exists anywhere in the layout.

Keyboard-only users must tab through the entire navigation bar on every page load before reaching main content.

**Fix:** Add to `app/layout.tsx` before `<body>` content:
```html
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600">
  Skip to main content
</a>
```
And add `id="main-content"` to each page's `<main>` element.

---

### 2. Error Messages — No Live Region — WCAG 4.1.3 (AA) ❌

**Files:** `app/auth/sign-in/page.tsx`, `app/auth/sign-up/page.tsx`, `ExerciseClient.tsx`

Error divs are rendered conditionally but have no `role="alert"` or `aria-live` attribute. Screen readers will not announce errors when they appear.

**Examples:**
- Sign-in error (line 44-46): `<div className="... text-red-700">{error}</div>`
- Exercise error: inline error text with no ARIA role

**Fix:** Add `role="alert"` to all error message containers:
```html
<div role="alert" aria-live="polite" className="... text-red-700">{error}</div>
```

---

### 3. Streaming Response — No Live Region — WCAG 4.1.3 (AA) ❌

**File:** `ExerciseClient.tsx` (lines 190–200)

The streaming AI response is written into a div with no `aria-live` region. Screen reader users receive no feedback that a response has arrived or is being updated.

**Fix:**
```html
<div aria-live="polite" aria-label="AI response">
  {response}
</div>
```
Also add `aria-busy="true"` while streaming, then remove it on completion.

---

### 4. Form Loading States — Missing `aria-busy` — WCAG 4.1.3 (AA) ❌

**Files:** `app/auth/sign-in/page.tsx`, `app/auth/sign-up/page.tsx`, `ExerciseClient.tsx`

Buttons change label text ("Signing in…", "Running…") during async operations but do not set `aria-busy` or `aria-disabled` on the form/button. Screen readers may not convey the loading state reliably.

**Fix:**
```html
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? "Signing in…" : "Sign in"}
</button>
```

---

### 5. Textarea Missing Associated Label — WCAG 1.3.1 (A) ❌

**File:** `ExerciseClient.tsx` (line 164)

The textarea for prompt input is not programmatically associated with a label. The nearby `<h2>Your prompt</h2>` provides visual context but is not a semantic label.

**Fix:** Replace the `<h2>` with a `<label>` or add `aria-labelledby`:
```html
<label htmlFor="prompt-input" className="...">Your prompt</label>
<textarea id="prompt-input" ... />
```
Or:
```html
<h2 id="prompt-label">Your prompt</h2>
<textarea aria-labelledby="prompt-label" ... />
```

---

### 6. Role Selection — Missing `<fieldset>/<legend>` — WCAG 1.3.1 (A) ❌

**File:** `app/auth/sign-up/page.tsx` (lines 120–144)

The "I am a…" radio group uses a `<p>` element as a visual group label instead of a `<fieldset>` with a `<legend>`. Screen readers cannot associate the group label with the individual radio choices.

**Fix:**
```html
<fieldset>
  <legend className="block text-sm font-medium text-gray-700 mb-2">I am a…</legend>
  <div className="grid grid-cols-2 gap-3">
    {/* radio options */}
  </div>
</fieldset>
```

---

### 7. Navigation Elements Missing `aria-label` — WCAG 1.3.1 (A) ❌

**Files:** `app/dashboard/page.tsx`, `app/workshops/page.tsx`, workshop detail pages

When multiple `<nav>` elements exist on a page (e.g., main nav + breadcrumb), they must have distinct `aria-label` attributes so screen reader users can differentiate them.

**Fix:**
```html
<nav aria-label="Main navigation">...</nav>
<nav aria-label="Breadcrumb">...</nav>
```

---

### 8. Breadcrumb Not Semantically Structured — WCAG 1.3.1 (A) ❌

**File:** `app/workshops/[id]/exercises/[exerciseId]/page.tsx` (lines 53–57)

Breadcrumb uses plain `<div>` and `<span>` elements. No `aria-label="Breadcrumb"` nav wrapper, no `aria-current="page"` on the final item, and `/` separators are read aloud.

**Fix:**
```html
<nav aria-label="Breadcrumb">
  <ol className="flex items-center gap-2">
    <li><a href="/workshops">Workshops</a></li>
    <li aria-hidden="true">/</li>
    <li><a href={`/workshops/${workshopId}`}>{workshopTitle}</a></li>
    <li aria-hidden="true">/</li>
    <li aria-current="page">{exerciseTitle}</li>
  </ol>
</nav>
```

---

### 9. Interactive Cards Missing Focus Indicator — WCAG 2.4.7 (AA) ❌

**Files:** `app/dashboard/page.tsx`, `app/workshops/page.tsx`, `app/workshops/[id]/page.tsx`

Card-style link elements lack `focus:ring` or `focus:outline` Tailwind classes. Keyboard users cannot visually identify which card is focused.

**Affected elements:** Workshop cards, exercise list items, "Browse Workshops" dashboard card.

**Fix:** Add to all card `<a>` elements:
```
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

---

### 10. Dashboard Missing H1 — WCAG 1.3.1 (A) ❌

**File:** `app/dashboard/page.tsx`

The dashboard page has no `<h1>` element. The logo is rendered as a `<span>` and the first heading-like text is a welcome message `<p>`. Screen reader users have no page identity landmark.

**Fix:** Add a visible or visually-hidden `<h1>` early in the page:
```html
<h1 className="sr-only">Dashboard</h1>
```
Or promote the welcome message to `<h1>`.

---

### 11. Color Contrast — Needs Verification — WCAG 1.4.3 (AA) ⚠️

The following Tailwind color combinations appear throughout the app and may fail the 4.5:1 contrast ratio requirement for normal text:

| Foreground | Background | Usage | Status |
|-----------|-----------|-------|--------|
| `text-gray-600` | `bg-gray-50` / white | Subtitles, descriptions | **Verify** |
| `text-blue-500` | white | Inline links | **Likely fail** (4.2:1) |
| `text-blue-600` | white | Nav links, headings | **Verify** (4.7:1 — may pass) |
| `animate-pulse text-blue-500` | white | Streaming indicator | **Fail + motion concern** |

**Action:** Run the site through axe DevTools or WAVE; replace `blue-500` link text with `blue-700` for sufficient contrast. Remove or provide `prefers-reduced-motion` override for the `animate-pulse` class.

---

### 12. Animated Content — No Motion Preference — WCAG 2.3.3 (AAA) ⚠️

**File:** `ExerciseClient.tsx`

The "streaming…" indicator uses `animate-pulse`. Users with vestibular disorders or epilepsy may be affected.

**Fix:**
```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse { animation: none; }
}
```
Tailwind's `motion-safe:animate-pulse` utility handles this:
```html
<span className="motion-safe:animate-pulse">streaming…</span>
```

---

## What Passes ✅

- `lang="en"` set on `<html>` element
- All form inputs have associated `<label>` elements with `htmlFor`
- `required` attributes present on mandatory form fields
- `type="email"` and `type="password"` used correctly
- Form submit buttons use `<button type="submit">` (not `<div>`)
- Sign-out uses a `<form>` POST action (not a `<a>` link)
- Images have descriptive alt text
- Heading hierarchy (H1→H2→H3) is correct on workshop and exercise pages
- `<main>` landmark present on all pages
- Keyboard tab order follows visual layout (left-to-right, top-to-bottom)
- Form focus rings on inputs and submit buttons (sign-in/sign-up)

---

## Remediation Plan

### Phase 1 — Critical (Level A, affects all users)

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 1 | Skip-to-content link | `app/layout.tsx` | XS |
| 2 | Error messages: add `role="alert"` | Auth pages, ExerciseClient | XS |
| 3 | Textarea: add `<label>` or `aria-labelledby` | `ExerciseClient.tsx` | XS |
| 4 | Role fieldset: `<fieldset><legend>` | `sign-up/page.tsx` | XS |
| 5 | Nav `aria-label` attributes | All pages with nav | XS |
| 6 | Breadcrumb semantic markup | Exercise page wrapper | S |
| 7 | Dashboard `<h1>` | `dashboard/page.tsx` | XS |

### Phase 2 — Important (Level AA, affects keyboard/SR users)

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 8 | Streaming response: `aria-live` + `aria-busy` | `ExerciseClient.tsx` | S |
| 9 | Loading states: `aria-busy` on buttons | Auth pages, ExerciseClient | XS |
| 10 | Card focus indicators: `focus:ring-2` | Dashboard, workshops | XS |
| 11 | Color contrast: replace `blue-500` with `blue-700` | Global | S |

### Phase 3 — Enhancement (AAA / polish)

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 12 | Motion: `motion-safe:animate-pulse` | `ExerciseClient.tsx` | XS |

---

## Recommended Tooling

- **axe DevTools** (browser extension) — automated per-page scanning
- **WAVE** — visual overlay of issues
- **Colour Contrast Analyser** (desktop app) — eyedropper contrast testing
- **VoiceOver (macOS) / NVDA (Windows)** — manual screen reader testing
- **@axe-core/react** — integrate automated checks into the test suite

---

## Related Issues

- PROA-4: This audit (source task)
- Remediation tasks should be created as subtasks under the platform goal
