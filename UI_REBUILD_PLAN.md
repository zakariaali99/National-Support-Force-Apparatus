# UI Rebuild — From Scratch

> **RETIRED** — superseded by `plans/ui-rebuild-finish-plan.md`. Retained for
> reference. Its Phases 1–2 landed (tokens + primitives); the remaining phases
> are executed under the new plan.

**Status:** retired
**Supersedes:** `FRONTEND_REBUILD_PLAN.md` (Phases A–F, partially executed — see "What actually landed" below)
**Does not touch:** `PLAN.md` (backend). No API contract changes.

---

## 1. Scope, locked with the user

| Decision | Choice |
|---|---|
| Rebuild depth | New presentation layer. `index.css`, all of `components/`, and every page component are deleted and rewritten. `lib/api.js`, `lib/tokenStorage.js`, `lib/queryClient.js`, `lib/createResourceHooks.js`, `features/*/api.js`, `features/auth/AuthContext.jsx`, `features/members/constants.js` are **kept verbatim**. |
| Visual identity | Institutional navy/ink + restrained gold, derived from the NASF seal. Gold is an accent and active-state indicator, never body text. |
| Component stack | Radix primitives + Tailwind v4, code owned in-repo (shadcn philosophy). **HeroUI and framer-motion removed.** GSAP kept for the handful of real animations. |

Zero backend risk by construction: every network call keeps flowing through code this rebuild does not open.

---

## 2. Audit of what exists today

Measured, not estimated — counts are from `frontend/src` (5,935 lines of JS/JSX).

### Dependency bloat

| Package group | Installed | Actually imported |
|---|---|---|
| `@heroui/*` | 17 packages | **1 line** (`HeroUIProvider` in `main.jsx`) |
| `framer-motion` | yes | **0 files** |
| `gsap` + `@gsap/react` | yes | 1 file (`lib/motion.js`) |
| `@radix-ui/*` | 8 packages | 10 files |

Three overlapping systems shipping in the bundle, one of them entirely dead. Removing HeroUI and framer-motion alone should take a meaningful bite out of the 451KB main chunk.

### Typography — the single biggest readability problem

A full semantic type scale is defined in `index.css` (`--text-display` … `--text-micro`). It is **almost entirely unused**:

| Utility | Occurrences |
|---|---|
| `text-micro` (the scale token) | 9 |
| `text-xs` (12px, ad hoc) | 50 |
| `text-[10px]` (arbitrary) | 16 |
| `font-bold` / `font-extrabold` / `font-black` | 71 |

Body text sits at 14px, labels at 12px, and a lot of real content at **10px** — in Arabic. Research (§3) puts the Arabic body floor at 16px with 1.5–1.7 line-height, because Arabic letterforms and diacritics need more vertical room than Latin at the same nominal size. And with 71 bold-weight utilities across ~40 files, *everything* is bold, so nothing reads as emphasis. This is the concrete cause of "hard on the eye."

### Structural inconsistency

- **Two table systems.** `DataTable.jsx` on 7 pages; hand-rolled `<table>` markup on `DashboardPage` and `MemberList`. Different padding, different header treatment, different hover.
- **No page shell.** Every page reinvents its own title block, description, and action row.
- **Nav grouping is computed by string matching.** `Sidebar.jsx` derives its three groups by filtering `NAV_ITEMS` on `to.startsWith("/organization")` etc. Adding a route silently lands in the wrong group or none.
- **`MemberDetail` never got tabs.** `FRONTEND_REBUILD_PLAN.md` Phase D specified it; the file still stacks every section as sequential cards. `Tabs.jsx` exists and is used only inside `ProfileExtras`.
- **Global CSS reaches into everything.** `* { transition-colors }`, `button { active:scale-95 }`, and a blanket `input, select, textarea` focus/radius rule in `@layer base` override component-level styling and make per-component states unpredictable.
- **Dead brand values.** `body` still paints radial gradients in `rgba(212,175,55)` gold and `rgba(10,37,64)` navy — leftovers from the previous theme, invisible against the current blue/slate palette they no longer match.

### What actually landed from the previous plan

Phases A, B and F of `FRONTEND_REBUILD_PLAN.md` are done (token scaffolding, component library, route code-splitting). Phase C is partial (GSAP wired, used on one page). Phase D is largely unstarted. Phase E is unverified. This rebuild absorbs the unfinished parts rather than tracking them separately — **`FRONTEND_REBUILD_PLAN.md` is retired on approval of this document.**

---

## 3. Research inputs

- **Arabic type sizing.** Arabic body copy wants 16–20px and 20–25% larger than the equivalent Latin, with line-height at or above 1.5 (1.7+ where diacritics appear). 16px is the mobile floor — below it, iOS zooms form fields on focus. Cairo is confirmed as a sound UI face for this; it stays.
- **UAE Design System 2.0** (the closest authoritative Arabic-first *government* system): 16px base, major-third scale, body line-height ≥1.5, ≤5 font weights per page, 60–100 character line length. Their heading scale is built for public-facing pages and is far too large for a dense admin tool — the scale in §4.2 keeps their *rules* and retargets the *sizes* for an application UI.
- **Data-dense admin UI practice.** Space is what makes dense data feel calm — generous whitespace and larger radii instead of cramming; accent colors used sparingly at high contrast; anything that does not serve a purpose gets removed.
- **Design token layering.** Three tiers — primitive (raw values) → semantic (intent: `surface-raised`, `text-subtle`) → component. Components reference semantic tokens only, never raw hex. This is what makes the light/dark pair maintainable instead of two hand-tuned palettes drifting apart.
- **Navigation IA.** Sidebar with explicit grouping is right for an app with this many surfaces; grouping must mirror the domain model, declared not inferred.

Sources are listed at the end of this document.

> The Figma connector is not authorized in this environment, so there is no design-tool round-trip. The visual direction is specified as tokens and code, and previewed as a live HTML page (Phase 0 deliverable) rather than as Figma frames.

---

## 4. The design system

### 4.1 Color

Primitives are read off the seal: ink-black ground, gold eagle and ring, cream outer band.

```
ink    950 #0A0D14   900 #121826   800 #1A2234   700 #232C40   600 #2F3A52
navy   900 #131C33   800 #1A2740   700 #24365A   600 #2F4674   500 #3E5A93
gold   700 #8A6D14   600 #A5801E   500 #C9A227   400 #D9B84A   300 #E8CE81   100 #F6EBCB
paper  50  #FAF8F4   100 #F3F0E9   200 #E7E2D6   300 #D6CFBE
```

Semantic layer — the only thing components are allowed to reference:

> **Landed in Phase 1.** The table below is the shipped set, after
> `scripts/check-contrast.mjs` rejected four of the starting values. Three
> changes the gate forced, all worth recording:
> - **`--fg` / `--fg-subtle`**, not `--text` / `--text-subtle`. Tailwind turns
>   `--color-text` into a `text-text` utility, which is unusable.
> - **`--border` split into `--border` and `--border-strong`.** A separator
>   between two surfaces is decorative and WCAG does not require it to pass;
>   an input outline *is* the affordance and must clear 3:1. One token for both
>   is how control outlines end up invisible.
> - **`--accent` split into `--accent` / `--accent-indicator` / `--accent-text`.**
>   Gold at `#C9A227` is 2.42:1 on white — fine as a fill with ink text on it
>   (8:1), illegal as the 3px underline marking an active tab. One gold cannot
>   do all three jobs on a light ground.

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--bg` | `paper-100` `#F3F0E9` | `ink-950` `#0A0D14` | Warm paper, not cold slate. Flat — the decorative body gradients are deleted. |
| `--surface` | `#FFFFFF` | `ink-900` `#121826` | Cards, panels |
| `--surface-raised` | `paper-50` `#FAF8F4` | `ink-800` `#1A2234` | Table headers, toolbars, hover |
| `--fg` | `ink-950` | `#E9E6DF` | Warm off-white in dark, not `#FFFFFF` — pure white on near-black is the classic eye-strain pairing |
| `--fg-subtle` | `#596072` | `#9AA1B1` | 5.5:1 / 7.5:1 |
| `--border` | `paper-300` `#D6CFBE` | `ink-700` `#232C40` | Decorative separators only |
| `--border-strong` | `#8A8271` | `#5C6A88` | Control outlines. Must clear 3:1 — both do (3.35 / 3.58) |
| `--primary` / `--primary-fg` | `navy-800` / white | `navy-500` `#4A69A8` / white | Dark navy lightened from `#3E5A93`, which sat at 2.86:1 against the page |
| `--accent` / `--accent-fg` | `gold-500` / `ink-950` | `gold-400` / `ink-950` | **Fill only.** Ink text on gold, 8:1 |
| `--accent-indicator` | `gold-750` `#9E7C15` | `gold-400` | Active nav rail, active tab underline. 3.36:1 min |
| `--accent-text` | `gold-800` `#7A5F0F` | `gold-300` | The one gold legible as text |
| `--success` | `#1A6B42` | `#3FBF84` | Paired with `-surface` / `-border` |
| `--warning` | `#8F5806` | `#E0B341` | |
| `--danger` | `#B3261E` | `#F2857C` | |
| `--focus` | `navy-600` | `gold-400` | Single focus ring token, applied uniformly |

**Contrast is enforced, not eyeballed.** `scripts/check-contrast.mjs` parses the
tokens out of `index.css` (rather than restating them, so it cannot drift),
resolves the `var()` indirection, and asserts 23 pairs per mode — 4.5:1 for
text, 3:1 for large text and UI boundaries. It runs in `npm run lint` and exits
non-zero on any failure. **That gate is the deliverable, not this table.**

Status colors get a paired treatment (`--success-surface`, `--success-border`, `--success-text`) so badges stop being one-off `bg-amber-500/10 text-amber-600 dark:text-amber-400` strings, which is how `DashboardPage` currently does it.

### 4.2 Typography

Cairo stays, self-hosted as today. The scale is rebuilt for Arabic-first reading.

| Token | Size | Line-height | Weight | Used for |
|---|---|---|---|---|
| `text-display` | 28px | 1.3 | 700 | Page hero (dashboard greeting only) |
| `text-title` | 22px | 1.35 | 700 | Page titles |
| `text-section` | 18px | 1.4 | 600 | Card and section headers |
| `text-body` | **16px** | **1.7** | 400 | Default. Everything unmarked is this. |
| `text-body-sm` | 15px | 1.6 | 400 | Dense table cells |
| `text-label` | 14px | 1.5 | 500 | Form labels, metadata keys |
| `text-caption` | 13px | 1.5 | 400 | Helper text, timestamps |

**Hard rules, lint-enforced:**
- **13px is the floor.** `text-[10px]`, `text-xs`, and `text-micro` are removed from the codebase and banned. Phase 1 adds an `oxlint` rule (or a `rg` gate in `npm run lint`) that fails on arbitrary `text-[…px]` values and on `text-xs`.
- **Three weights only:** 400 regular, 600 semibold, 700 bold. `font-extrabold`/`font-black` are gone. All 71 current bold utilities are re-derived from the scale rather than reapplied.
- **Numerals.** Force numbers, national numbers, dates and counts render with `font-variant-numeric: tabular-nums` and `dir="ltr"` via a `<Num>` primitive, so columns align and Latin digits never reorder inside RTL text. This replaces the scattered `font-mono` + manual `dir="ltr"` pairs.
- **Line length** capped at 75ch on prose blocks.

### 4.3 Spacing, radius, elevation

4px base scale. Density is fixed by *reducing padding while increasing text size* — the inverse of the current cards, which pair `p-6` with 10px text.

- Spacing: `1`=4 `2`=8 `3`=12 `4`=16 `5`=20 `6`=24 `8`=32 `10`=40 `12`=48
- Radius: `control` 8px (inputs, buttons) · `card` 12px · `panel` 16px (dialogs, sheets)
- Elevation: three levels only — `flat` (border only), `raised` (cards), `overlay` (dialogs, popovers, dropdowns). Dark mode uses lighter surfaces rather than shadows, since shadows are invisible on near-black.
- **`glass-card`, `card-gold-accent`, and `backdrop-blur` are deleted.** Translucent blurred surfaces over a dense Arabic table are exactly the "hard on the eye" complaint: they lower text contrast and cost a compositing layer per card.

### 4.4 Motion

`lib/motion.js` is rewritten, keeping its existing duration/easing constants.

- Durations: `fast` 120ms, `base` 200ms, `slow` 320ms. Everything currently ≥400ms comes down — long transitions read as lag in a data tool.
- `prefersReducedMotion()` guards every GSAP call; CSS animations already degrade via the existing media query, which is kept.
- **What gets motion:** dialog/popover entry, toast, list stagger on first paint only (not on refetch), sidebar active-rail slide, dashboard KPI count-up.
- **What loses motion:** the global `* { transition-colors }` and `button { active:scale-95 }` base rules — replaced by explicit transitions on the components that need them.

### 4.5 Component inventory

Every component is rewritten from scratch against the new tokens. Radix where a primitive exists.

**Primitives** — `Button` (solid/outline/ghost/danger × sm/md/lg, `loading`, `asChild`), `IconButton`, `Input`, `Textarea`, `Select` (Radix, replacing native), `Combobox` (cmdk, already installed), `Checkbox`, `RadioGroup`, `Switch`, `Label`, `FieldError`, `Badge`, `Avatar`, `Separator`, `Skeleton`, `Num`.

**Overlays** — `Dialog`, `AlertDialog` (replacing the two `window.confirm()` calls in `MemberDetail` and elsewhere), `Popover`, `DropdownMenu`, `Tooltip`, `Sheet` (mobile drawer), `Toast`.

**Composition** — these are the ones that kill the current inconsistency:

| Component | Replaces |
|---|---|
| `PageHeader` | The bespoke title + description + action row on all 11 pages |
| `DataTable` | Both table systems. One implementation: sticky header, zebra-free row separation, sortable columns, per-column alignment, `loading`/`empty`/`error` states built in, horizontal scroll containment, and a card-list fallback under 640px instead of a scrolling table |
| `FilterBar` | `MemberList`'s hand-built search + 3 selects + active-filter counter |
| `StatCard` | `DashboardPage`'s inline KPI markup with its per-card color strings |
| `DetailGrid` / `DetailItem` | `MemberDetail`'s local `DetailItem` |
| `EmptyState` / `ErrorState` | The three different "no results" treatments |
| `FormSection` | Ad-hoc `<div className="space-y-4">` grouping in `MemberForm` |
| `Pagination` | `MemberList`'s inline prev/next |
| `PermissionGate` | Inline `hasPermission(...) && ...` — same behavior, one place |

**RTL discipline.** Logical properties (`ps-`/`pe-`/`ms-`/`me-`/`start-`/`end-`) only; no `left`/`right`. Directional icons (chevrons, arrows) go through an `<DirIcon>` wrapper that mirrors under RTL — replacing the current manual `rtl:rotate-0 rotate-180` and the hand-picked `ChevronRight` for "previous". Non-directional icons (play, external-link) must not mirror.

---

## 5. Information architecture

`navConfig.js` becomes an explicit nested structure; `Sidebar.jsx` stops inferring groups from URL prefixes.

```
نظرة عامة
  └ لوحة التحكم                  /
القوة
  └ سجل الأعضاء                  /members
الهيكل التنظيمي
  ├ الرتب                        /organization/ranks
  └ الفصائل (الإدارات)            /organization/factions
إعدادات النظام
  ├ متطلبات الحقول               /settings/field-requirements
  ├ الأدوار والصلاحيات            /settings/roles
  └ مستخدمو النظام               /settings/users
السجلات والصيانة
  ├ سجل التدقيق                  /audit
  └ النسخ الاحتياطية              /backups
```

Groups collapse when empty (permission-filtered), same as today. Route→breadcrumb mapping moves out of `AppShell`'s 35-line if/else chain and into route metadata on this same config, so a new route can't be added without its label.

**New: command palette (`⌘K` / `Ctrl+K`).** `cmdk` is already a dependency. Jumps to any page and searches members by name or force number through the existing `useMembers` hook. For a records system where the dominant task is "find one person," this is the largest single user-friendliness gain available, and it costs one component.

---

## 6. Page-by-page

| Page | Change |
|---|---|
| `LoginPage` | Centered card on ink field with the seal at real size. Inline field errors, no toast-only failures. |
| `AppShell` | Sidebar + header rebuilt on new tokens. Breadcrumbs from route metadata. Skip-to-content link, `<main>`/`<nav>` landmarks. Command-palette trigger in header. |
| `DashboardPage` | `StatCard` × 4 with paired status tokens; recent-members widget moves onto the shared `DataTable`; shortcut tiles rebuilt at readable sizes (currently 10px descriptions). |
| `MemberList` | `FilterBar` + `DataTable`. Filters become removable chips showing what's active, replacing the bare count badge. Grid/list toggle persists per user in `localStorage`. Card view rebuilt — current cards are 4 densities of tiny text stacked. |
| `MemberDetail` | **Tabs** — نظرة عامة / المستندات / السجل الوظيفي (`ProfileExtras`) / التعهدات. Sticky identity header with photo, name, rank, status, actions. `window.confirm` → `AlertDialog`. |
| `MemberForm` | `FormSection` groups with an in-page section rail; `Combobox` for rank/faction; errors summarized at top and anchored per field; unsaved-changes guard on navigation. |
| `RanksPage` / `FactionsPage` | Shared `DataTable` + inline `Dialog` editor. |
| `FieldRequirementsPage` | Grouped toggle list, not a table — it is a settings surface, not a record set. |
| `RolesPage` | Permission matrix rebuilt as a proper grid with sticky first column and group headers; today it is 320 lines of checkbox layout. |
| `UsersPage` | `DataTable` + role assignment in a dialog. Largest file at 442 lines — expect real reduction from the shared components. |
| `AuditPage` | `DataTable` with a date-range filter and diff rendering in `HistoryDialog`. |
| `BackupsPage` | Keep the staleness banner (it works); rebuild on `EmptyState`/`ErrorState`. |
| `PrintDialog` | Section checklist at readable size, select-all, stagger on open. Backend print templates untouched. |

---

## 7. Phases

Each phase ends green on `npm run lint` and `npm run build`, plus a live browser pass in light **and** dark at 1440px and 390px. No phase is "done" on a build alone.

### Phase 0 — Direction preview *(no app code)*
Standalone HTML page rendering the full token set, type scale, every component state, and a mocked Members and Member-detail screen in both modes. **Approval gate — nothing in `src/` is deleted until you sign off on how it looks.**

### Phase 1 — Foundation ✅ *done*
Delete `index.css` and write the new token layer (primitives → semantic → `@theme inline`). Remove `@heroui/*` (17 packages) and `framer-motion`; drop `HeroUIProvider` from `main.jsx`. Add `scripts/check-contrast.mjs` and the typography lint gate, both wired into `npm run lint`. Rewrite `lib/motion.js`.

*Result:* 46/46 contrast pairs pass in both modes. Typography gate records the
156 pre-rebuild violations across 29 files as a **per-file budget ratchet**
(`scripts/typography-debt.json`) — new files must be clean, budgeted files may
only improve, and Phase 7 deletes the file. Verified both failure modes bite.
Main chunk 458.40 → 451.45 kB; `node_modules` 321M → 156M. Body type now
16px/1.7 (was 14px/1.5). Two bugs caught and fixed in the process: the contrast
parser silently skipped every block after the first, and a `border-radius`
inside `:focus-visible` would have changed element shape on focus.

### Phase 2 — Primitives and overlays
All primitives and overlays from §4.5. `DirIcon` and `Num`.
*Demo:* a `/dev/kitchen-sink` route (dev-only, not in the production route table) showing every component in every state, both modes, RTL — keyboard-navigable end to end.

### Phase 3 — Composition components
`PageHeader`, `DataTable`, `FilterBar`, `StatCard`, `DetailGrid`, `EmptyState`, `ErrorState`, `FormSection`, `Pagination`, `PermissionGate`.
*Demo:* `DataTable` driven by real `useMembers` data — sort, paginate, empty, error, loading, and the sub-640px card fallback.

### Phase 4 — Shell and navigation
`AppShell`, `Sidebar`, mobile `Sheet`, `UserMenu`, `NotificationBell`, `ThemeToggle`, nested `navConfig`, breadcrumbs from route metadata, command palette, skip link, landmarks.
*Demo:* every route reachable from the sidebar and from `⌘K`; permission-filtered groups verified against two roles; full keyboard traversal.

### Phase 5 — Pages, part one *(highest traffic)*
`LoginPage`, `DashboardPage`, `MemberList`, `MemberDetail`, `MemberForm`, `DocumentUpload`, `PrintDialog`, `ProfileExtras`.
*Demo:* create → view → edit → print → delete a member, in both modes, desktop and mobile.

### Phase 6 — Pages, part two
`RanksPage`, `FactionsPage`, `FieldRequirementsPage`, `RolesPage`, `UsersPage`, `AuditPage`, `BackupsPage`.
*Demo:* each page CRUD-verified live.

### Phase 7 — Audit and close
Full keyboard pass; visible focus on every interactive element; 44px minimum tap targets; `prefers-reduced-motion` spot-check (animations must no-op, not shorten); RTL icon-mirroring sweep; screen-reader label pass on icon-only buttons; bundle report; delete dead assets and the `/dev/kitchen-sink` route from the production build. Retire `FRONTEND_REBUILD_PLAN.md`, update `NEXT.md`.
*Demo:* before/after screenshots per page; final bundle numbers against the current 451KB main chunk.

**Rough weighting:** Phases 0–4 are roughly 40% of the work and carry all the risk; 5–6 are mechanical once the components exist; 7 is a day.

---

## 8. Out of scope

- Any backend change. `PLAN.md` Phase 6 (member approval workflow) stays removed and is not reintroduced — the `approval_status` badge on existing pages is display-only, as today.
- New features. `⌘K` is the sole addition, and only because it navigates to what already exists.
- Backend-rendered print templates (`backend/templates/print/*.html`) and ID cards.
- The SVG seal. Still needs a real designer; the 447×447 JPEG remains adequate at the sizes used here.
- English/LTR locale. The app is Arabic-only; the logical-property discipline keeps LTR cheap later, but no `en` bundle ships.

## 9. Risks

| Risk | Mitigation |
|---|---|
| A page silently loses a permission check during rewrite | `PermissionGate` is introduced in Phase 3 and every `hasPermission` call site is inventoried from git before its page is rewritten |
| Removing HeroUI breaks something unnoticed | It has exactly one import site; removal happens in Phase 1 in isolation with a build diff |
| Radix `Select` regresses against native on mobile | Verified at 390px in Phase 2 before any page depends on it |
| Contrast targets force palette changes late | The script lands in Phase 1, before any component consumes a token |
| Scope drift into features | Every phase lists its files; anything not listed needs a fresh ask |

---

## Sources

- [Arabic RTL Typography for Web Design: 2026 Guide — Voxire](https://voxire.com/blog/arabic-rtl-typography-web-design-2026/)
- [Typography guidelines — UAE Design System 2.0](https://designsystem.gov.ae/guidelines/typography)
- [Designing Arabic Interfaces: Right-to-Left UX Done Right — Code Guru](https://codeguru.ae/blog/designing-arabic-interfaces-right-to-left-ux-done-right/)
- [The Complete Guide to RTL Layout Testing](https://placeholdertext.org/blog/the-complete-guide-to-rtl-right-to-left-layout-testing-arabic-hebrew-more/)
- [HRM Dashboard Design for Modern Workforce Management, 2026 — MultiPurposeThemes](https://multipurposethemes.com/blog/hrm-dashboard-design-for-modern-workforce-management-and-business-productivity-in-2026/)
- [Top 5 Best Admin Dashboard Designs 2026 — AsApp Studio](https://www.asappstudio.com/admin-dashboard-designs-2026/)
- [Accessible Color Tokens for Enterprise Design Systems — Aufait UX](https://www.aufaitux.com/blog/color-tokens-enterprise-design-systems-best-practices/)
- [Design tokens explained — Contentful](https://www.contentful.com/blog/design-token-system/)
- [Sidebar Design for Web Apps: UX Best Practices 2026 — ALF Design Group](https://www.alfdesigngroup.com/post/improve-your-sidebar-design-for-web-apps)
