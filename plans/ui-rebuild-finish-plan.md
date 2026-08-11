# NASF UI Rebuild — Finish Plan (Phases 0–5)

**Status:** active
**Branch:** `ui-rebuild`
**Supersedes:** `UI_REBUILD_PLAN.md`, `FRONTEND_REBUILD_PLAN.md`,
`plans/system_ui_ux_overhaul_plan.md`, `plans/administrative_system_ui_ux_plan.md`.
The other four documents are retained for reference but are no longer the working plan.

**Scope:** finish the in-flight UI/UX rebuild. No backend/API changes, no new
features (sole addition: the ⌘K command palette, already approved in the
superseded plan). Backend-rendered print templates and the SVG seal stay out.

---

## Where the rebuild stands

Committed: Phase 1 token layer (`index.css` — semantic light/dark tokens, 46
contrast pairs enforced by `scripts/check-contrast.mjs`), Phase 2 primitives
(Button, Input, Select, Combobox, Checkbox, RadioGroup, FieldError, DirIcon,
Num, Tabs, Dialog, DropdownMenu, Popover, Tooltip, Avatar, etc.), route-level
code splitting in `App.jsx`.

Committed as the Phase 0 checkpoint: collapsible/accordion Sidebar, DashboardPage
rewrite (welcome header, 4 KPI cards, force-ratio bar, shortcuts), MemberList
quick-procedures + universal Pagination + Combobox filters + grid/list toggle,
new `Pagination.jsx`, DataTable hardening, Ranks/Factions/Roles/Users/Audit
polish, auto-generated slugs (zero English identifier input), `deploy/` removed.

Still old-style (this plan's work): `MemberDetail` (stacked cards, `text-[10px]`,
`window.confirm`, no top-level tabs), `MemberForm` (native Selects, no
FormSection/FieldError), `ProfileExtras` / `PrintDialog` / `DocumentUpload`
(tiny text, native checkboxes, `window.confirm`), `AppShell` (breadcrumb
if/else, no skip link, header blur), flat `navConfig` (Sidebar infers groups by
string matching), no command palette, no shared
PageHeader/FilterBar/StatCard/DetailGrid/FormSection/PermissionGate.

Gates: `npm run lint` (oxlint + 46 contrast pairs + typography ratchet) green;
`npm run build` green, main chunk ≈ 453 kB.

---

## Phase 1 — Composition components (was UI_REBUILD Phase 3)

Shared components replacing bespoke per-page markup. Each file under
`frontend/src/components/ui/`:

- `PageHeader.jsx` — title + description + action slot. Replaces the 11
  hand-built title blocks (Dashboard, MemberList, Ranks, Factions, Roles,
  Users, Audit, Backups, FieldRequirements, MemberForm, MemberDetail).
- `FilterBar.jsx` — search + filters + active-filter chips. Replaces
  MemberList's inline filter card.
- `StatCard.jsx` — icon + title + animated value + pulse. Replaces Dashboard's
  inline KPI markup.
- `DetailGrid.jsx` / `DetailItem.jsx` — key/value grid. Replaces MemberDetail's
  local `DetailItem` (and its `text-[10px]` labels).
- `FormSection.jsx` — titled section with icon, used inside forms. Replaces
  MemberForm's ad-hoc `space-y-4` groups.
- `PermissionGate.jsx` — render-prop wrapper over `hasPermission`. Replaces
  inline `hasPermission(...) && …` everywhere.
- `EmptyState.jsx` / `ErrorState.jsx` — already exist; wire them into the
  remaining bespoke "no results / failed" treatments (Backups, MemberList,
  ProfileExtras).
- `DataTable.jsx` — harden: sortable columns, per-column alignment (has it),
  and a **card-list fallback under 640px** instead of horizontal scroll.

Verification: dev-only `/dev/kitchen-sink` route (removed in Phase 5) showing
every component in every state, light+dark, RTL, keyboard-navigable.

## Phase 2 — Shell & navigation (was UI_REBUILD Phase 4)

- `navConfig.js` → explicit **nested groups** (العامة / الهيكل التنظيمي /
  إعدادات النظام / السجلات والصيانة) with per-route metadata: label, icon,
  permission, and breadcrumb. `Sidebar.jsx` stops deriving groups by
  `to.startsWith(...)`.
- `AppShell.jsx` — breadcrumbs from route metadata (deletes the 35-line
  if/else), **skip-to-content link**, `<main>`/`<nav>` landmarks; header loses
  `backdrop-blur` for a solid `bg-surface`.
- **Command palette (⌘K / Ctrl+K)** via `cmdk` (installed, currently dead) —
  jumps to any page and searches members by name or force number through the
  existing `useMembers` hook. Trigger in the header, bound to ⌘K.

## Phase 3 — Member pages (was UI_REBUILD Phase 5)

- `MemberDetail.jsx` — top-level **Tabs**: نظرة عامة / المستندات / السجل
  الوظيفي / التعهدات. Sticky identity header (photo, name, rank, status,
  actions). `DetailGrid`. `window.confirm` → `AlertDialog`. Remove the gradient
  + blur decor. Text floor (≥13px).
- `MemberForm.jsx` — `FormSection` groups; native `Select` → `Combobox` for
  rank/faction; `FieldError` per field + top-of-form error summary;
  unsaved-changes guard on navigation. Text floor.
- `ProfileExtras.jsx` — shared `EmptyState`, text-floor fixes (tabs already in
  place; keep them).
- `PrintDialog.jsx` — native checkboxes → `Checkbox` primitive; text floor;
  keep the GSAP stagger.
- `DocumentUpload.jsx` — `window.confirm` → `AlertDialog`; `EmptyState`.

## Phase 4 — Settings / org / audit pages (was UI_REBUILD Phase 6)

- `RolesPage.jsx` — permission matrix rebuilt as a proper grid: sticky first
  column, group headers, `Checkbox` primitive (today it is ~320 lines of
  hand-rolled checkbox layout).
- `FieldRequirementsPage.jsx` — grouped toggle list (it is a settings surface,
  not a record set).
- Text-floor and polish sweep on `UsersPage`, `RanksPage`, `FactionsPage`,
  `AuditPage`, `HistoryDialog`, `LoginPage` (FieldError + inline errors, no
  toast-only failures).

## Phase 5 — Audit & close (was UI_REBUILD Phase 7)

- Full keyboard pass; visible `:focus-visible` on every interactive element;
  44px minimum tap targets; `prefers-reduced-motion` spot-check (animations
  no-op, not shorten); RTL icon-mirror sweep through `DirIcon`; screen-reader
  labels on icon-only buttons.
- Delete the transitional compatibility block, `.glass-card`/`.glass-header`
  aliases and legacy keyframes in `index.css`; delete
  `scripts/typography-debt.json` once budgets hit zero; remove the
  `/dev/kitchen-sink` route.
- Before/after screenshots per page (light+dark, 1440px + 390px); final bundle
  numbers against the 453 kB main chunk.

---

## Verification (every phase)

- `npm run lint` and `npm run build` green after each phase.
- Live browser pass in light **and** dark at 1440px and 390px for every page
  touched that phase.

## Risks

| Risk | Mitigation |
|---|---|
| A page silently loses a permission check during rewrite | `PermissionGate` lands in Phase 1; every `hasPermission` call site inventoried before its page is rewritten |
| Radix `Select`/`Combobox` regresses against native on mobile | Verified at 390px before pages depend on it |
| Contrast targets force palette changes late | Gate already landed in Phase 1; token changes only via the script |
| Scope drift | Phases list their exact files; anything else needs a fresh ask |
