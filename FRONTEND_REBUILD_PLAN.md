# Frontend Visual/UX Rebuild — Plan

> **RETIRED** — superseded by `plans/ui-rebuild-finish-plan.md`. Retained for reference.

## Context

The app already has a working design system (navy/gold theme, glass-morphism
cards, Cairo font, RTL, dark mode) and every page (dashboard, members,
settings, print) is functional and backed by tests. The ask is a UX/visual
overhaul — not a rewrite: same React 19 + Vite + Tailwind 4 + TanStack Query
stack, same API contracts, nothing thrown away. Scope and approach confirmed
with the user:
- Redesign pass on top of the existing app, not a from-scratch rebuild.
- GSAP conventions applied by hand (no `npx skills` package install) — GSAP
  itself still gets added as a normal npm dependency, since actual animation
  code needs the library regardless of whether the Skill package is installed.
- shadcn/ui's philosophy (own the code, Tailwind + Radix primitives, `cva`
  variants) is already how `components/ui/*` is built — this plan completes
  that library rather than introducing a different one.

## Current state (audited)

- Tokens: `index.css` has a navy/gold light+dark palette wired through
  Tailwind's `@theme inline`, class-based dark mode, one glass-card utility,
  three CSS-keyframe animations (fade-in, slide-up, pulse-glow). No formal
  spacing/typography/elevation scale beyond Tailwind defaults.
- Components built: Button (with `asChild`), Card, Input, Label, Select
  (native), Textarea, Switch, Badge, Dialog, DataTable, Skeleton, Toast,
  AuthedImage. Radix packages installed but **not yet wrapped**:
  `react-dropdown-menu` (used ad hoc in `UserMenu.jsx`/`NotificationBell.jsx`
  rather than a shared component). No Tabs, Tooltip, Popover, Combobox,
  Avatar, or Separator component exists yet.
- Motion: CSS keyframes only, applied inconsistently (`animate-fade-in` /
  `animate-slide-up` classes sprinkled per-page). No shared timing/easing
  tokens, no `prefers-reduced-motion` handling, no GSAP.
- Pages: Dashboard (KPI cards + recent members + shortcuts, already fairly
  rich), Members (List/Form/Detail/DocumentUpload/PrintDialog/ProfileExtras),
  Settings (FieldRequirements/Roles/Users), Organization (Ranks/Factions),
  Login. `MemberDetail.jsx` stacks every section as separate cards rather
  than using tabs.
- Known issue carried forward from every prior phase: single 640KB+ JS
  bundle, no route-level code splitting.

## Approach — 6 phases

**Phase A — Design tokens & motion foundation**
- Formalize spacing/radius/shadow scale as `@theme` tokens (currently
  Tailwind defaults used ad hoc); add typography scale (Cairo weight/size
  pairs for h1/h2/body/caption used consistently instead of per-page
  `text-xl font-black` style choices).
- WCAG AA contrast pass on both palettes (gold-on-navy and navy-on-cream
  text combinations need checking, not just eyeballing).
- `npm install gsap @gsap/react`. Add `src/lib/motion.js`: shared
  durations/eases as JS constants mirroring the CSS timing tokens, a
  `usePageTransition()` hook, and a `prefersReducedMotion()` guard every
  animation call checks first.

**Phase B — Complete the component library**
Add, in shadcn's copy-owned/`cva`/Radix-primitive style, matching the
existing `components/ui/*` conventions:
- `DropdownMenu.jsx` (wraps the already-installed Radix primitive; refactor
  `UserMenu.jsx`/`NotificationBell.jsx` onto it instead of their current
  ad hoc implementation)
- `Tabs.jsx` (needed for Phase D's `MemberDetail` rework)
- `Tooltip.jsx`, `Popover.jsx`
- `Combobox.jsx` — searchable replacement for the native `Select` used for
  rank/faction pickers (biggest single UX upgrade in the member form/filters)
- `Avatar.jsx` (thin wrapper around `AuthedImage` with fallback initials)
- `Separator.jsx`, `EmptyState.jsx`, `ErrorState.jsx` (standardize the
  currently inconsistent "no results" / "failed to load" treatments across
  pages)

**Phase C — Motion layer**
Using `lib/motion.js` from Phase A, add (all gated on reduced-motion):
- Route-change transitions (fade/slide) in `AppShell.jsx`
- Staggered entrance for `MemberList`/`DataTable` rows and dashboard cards
- Count-up animation for Dashboard KPI numbers
- Sidebar active-item indicator that slides between nav items rather than
  snapping
- Dialog/print-popup open choreography beyond Radix's default fade

**Phase D — Page-by-page redesign pass**
- `MemberDetail.jsx`: replace stacked cards (Documents / Notes / Tasks /
  Evaluations / Vacation) with the new `Tabs` component — same data hooks,
  just reorganized layout.
- `MemberList.jsx` / `MemberForm.jsx`: swap native `Select` filters/rank/
  faction pickers for `Combobox`.
- `FieldRequirementsPage.jsx` / `RolesPage.jsx` / `UsersPage.jsx`: consistent
  table styling, `EmptyState`/`ErrorState` usage, permission-checkbox layout
  polish (`RolesPage`).
- `PrintDialog.jsx`: apply the "select all" + per-section checklist stagger
  motion from Phase C; visual pass on the popup itself (the print output
  templates are backend-rendered and out of scope here).
- `LoginPage.jsx`: subtle entrance motion, no functional change.

**Phase E — Responsive & accessibility audit**
- Mobile drawer touch interactions, tap target sizing (44px minimum)
- `focus-visible` ring audit on every interactive element (many currently
  rely on browser default)
- RTL icon-mirroring audit (chevrons/arrows that should flip vs. ones that
  shouldn't, e.g. a play icon)
- Skip-to-content link, landmark roles on `AppShell`

**Phase F — Performance**
- Route-level code splitting via `React.lazy`/`Suspense` per top-level page
  — this is what actually fixes the repeatedly-flagged single-bundle warning
  (deferred through every prior phase specifically for this rebuild)
- Confirm GSAP's tree-shaken import doesn't reintroduce the problem
- Lazy-load `AuthedImage` thumbnails in list views (`loading="lazy"`-style
  deferral, since they're already fetched as authenticated blobs)

## What's explicitly out of scope

- No backend/API changes — every hook in `features/*/api.js` stays as-is.
- No new pages/features — this is a visual/UX/motion pass over what exists.
- Backend-rendered print PDF templates (`backend/templates/print/*.html`)
  are untouched; only the frontend `PrintDialog` popup gets polish.

## Verification (per phase, same bar as backend phases)

- `npm run lint` / `npm run build` clean after every phase
- Live browser pass in the Browser pane: light + dark, desktop + mobile
  viewport, for every page touched that phase
- `prefers-reduced-motion: reduce` spot-check — animations must no-op, not
  just shorten
- Bundle size check after Phase F (`npm run build` output) confirming the
  single-chunk warning is gone
