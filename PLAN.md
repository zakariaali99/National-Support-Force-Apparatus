# NASF Member Management System — Implementation Plan

## Status

- [x] Phase 0 — Foundation fixes & hardening
- [x] Phase 1 — Organization app, roles engine, app shell
- [x] Phase 2 — Member core CRUD + search
- [ ] Phase 3 — Settings: field requirements + role/user UI
- [ ] Phase 4 — Profile extras (notes/tasks/evaluations/vacation)
- [ ] Phase 5 — Printing, PDF, exports
- [ ] Phase 6 — Approval workflow + notifications
- [ ] Phase 7 — Audit UI, expiry alerts, backups, cron
- [ ] Phase 8 — Hardening & deploy

See [NEXT.md](NEXT.md) for the detailed current-state handoff (updated as work progresses).

## Context

The National Support Force Apparatus (الجهاز الوطني للقوى المساندة / NASF) needs a digital system to replace paper personnel records. It stores each member's identity data, scanned official documents (birth certificate, passport, national number paper), and a working profile (vacation, evaluations, notes, tasks). Around it: configurable required-fields, custom roles, an audit trail, search/filters, printable/exportable reports and ID cards, document-expiry alerts, an approval workflow, notifications, and scheduled backups.

The stack is already scaffolded: **Django 5.2 + DRF** (JWT auth, drf-spectacular, django-simple-history, soft-delete `BaseModel`) and **React 19 + Vite 8 + Tailwind 4**. Both are nearly empty of business logic. This plan builds the system on that foundation and fixes several latent bugs in the scaffolding first.

**Confirmed decisions:**
- **UI:** Arabic, right-to-left, but **Latin numerals** (0–9). No English UI.
- **Print/PDF:** server-side PDF generation with dedicated print views; each selected item on its own sheet.
- **Deployment:** local for now, kept portable to a plain VPS later (no Docker). Design for VPS defaults; avoid hard-locking.
- **Database:** PostgreSQL, in development too.
- **Roles:** custom roles with granular permission checkboxes (presets shipped, fully configurable).
- **Member extras:** add **blood type** and **date of birth** (not gender).
- **Force number:** globally unique.
- **Editing an approved member does not require re-approval** in v1 (all edits captured in history).
- **Notifications:** in-app only for v1 (polled), no websockets.

---

## Foundation fixes (must land before features)

The scaffolding has real bugs, verified against the code:

1. **Audit trail is silently dead.** `HistoryRequestMiddleware` reads `request.user` off the Django `HttpRequest`, populated by session auth — but the API uses JWT only, so `history_user` is `NULL` on every write. Fix: add `apps/core/middleware.py::JWTAuthenticationMiddleware` that resolves the JWT and sets `request.user`, ordered **before** `HistoryRequestMiddleware`. Add a test asserting `Member.history.first().history_user == caller`.
2. **Soft-delete `_base_manager` trap** (`apps/core/models/base.py:21`): `SoftDeleteManager` is declared first, so FK traversal to a soft-deleted row raises `DoesNotExist`. Fix: `Meta.base_manager_name = "all_objects"`, `default_manager_name = "objects"`. Make `soft_delete()` use `save(update_fields=[...])`.
3. **Soft-delete vs `unique=True`:** a soft-deleted member's force/national number can never be reused. Use `UniqueConstraint(condition=Q(is_deleted=False))` instead of `unique=True`.
4. **`phone` blank-unique collision** (`apps/core/models/user.py:12`): `unique=True, blank=True` with no `null=True` → only one user can lack a phone. Fix: `null=True, blank=True`, normalize `""`→`None`. Revert `REQUIRED_FIELDS` to `["email"]`.
5. **Settings gaps** (`config/settings/base.py`): `TIME_ZONE="Africa/Tripoli"`; add DRF pagination, `django-filter`, and login throttling; `MEDIA_URL="/media/"` and `MEDIA_ROOT` from env; production must fail on missing `SECRET_KEY`/`ALLOWED_HOSTS`; unpin `django-simple-history` from the git SHA.

New deps: `Pillow`, `django-filter`, `dj-database-url`, `openpyxl`, `pypdf`, `WeasyPrint`, `qrcode`.

---

## Data model (key decisions)

**`Member`** (`apps/members/models/member.py`, extends `BaseModel` + `HistoricalRecords`):
`first_name, second_name, third_name, last_name` (four Arabic name parts, separate CharFields) · `search_name` (normalized, indexed — see below) · `photo` + `photo_thumb` (EXIF stripped, downscaled on save) · `force_number` (CharField, globally unique among active) · `national_number` (12-digit, RegexValidator, Arabic-Indic→Latin normalized on input, unique among active) · `date_of_birth` · `blood_type` · `rank` (FK→Rank, PROTECT) · `faction` (FK→Faction, PROTECT) · `phone` (indexed, **not** unique) · `pledges` (TextField) · `join_date`, `place_of_birth` · `approval_status` (draft/pending/approved/rejected) **and** `service_status` (active/suspended/on_leave/retired/deceased) as **two separate indexed enums** · `vacation_balance_days` (denormalized cache) · `created_by`/`updated_by`.

- **Arabic search:** `apps/members/utils/arabic.py::normalize_ar()` strips tashkeel/tatweel and unifies alef/ة/ى variants; store result in `search_name` and search with `LIKE` on it (engine-portable). Without this, `احمد` won't match `أحمد` and users will think search is broken.

**Documents** — generic, table-driven:
- `DocumentType` (`apps/organization/models/document_type.py`): `code, name_ar, requires_expiry, expiry_warn_days, allow_multiple, is_printable, print_order, is_system`. Seeded with birth_certificate / passport / national_id_paper; new types need no migration.
- `MemberDocument` (`apps/members/models/document.py`): `member, document_type (FK), file (uuid filename, private storage), original_name, content_type (sniffed), file_size, sha256, issue_date, expiry_date (indexed), is_current, uploaded_by`. This makes the print-selection popup and "select all" generic.

**Profile extras** (richer than plain text, because the notification and audit requirements demand authorship/assignment/history):
- `MemberNote` (body, author, is_pinned)
- `MemberTask` (title, description, assigned_to, assigned_by, due_date, priority, status, completed_at) — drives task-assignment notifications
- `MemberEvaluation` (period_start/end, body, nullable score, evaluator, evaluated_on)
- `VacationRequest` (start/end, days, reason, status, requested_by, decided_by) → on approval writes a `VacationTransaction`
- `VacationTransaction` ledger (signed days, kind, reason, created_by); `Member.vacation_balance_days` updated atomically with `select_for_update()`; `recompute_vacation_balances` command for repair.

**Configurable required fields:**
- Canonical registry in `apps/members/field_registry.py` (key, label_ar, type, default_required, `lockable`). Structural fields (names, force_number, faction, rank) are `lockable=False`.
- `FieldRequirement` model holds mutable overrides (`is_required`, `is_visible`, order); `sync_field_requirements` command keeps table aligned with registry.
- Enforced **on create**; on PATCH only validates fields present (so tightening a rule doesn't lock existing records). Serializer exposes `missing_required_fields`. Schema cached, served to the frontend to drive the form.

**Roles & access:**
- Permission codenames in `apps/core/permissions/registry.py` (`member.view/create/edit/delete/approve/print/export`, `document.download_original`, `settings.manage`, `users.manage`, `roles.manage`, `audit.view`, `backup.run/download`, …) with Arabic labels grouped for the checkbox UI.
- `Role` model: `name, name_ar, permissions (JSONField validated against registry), scope (all/own_faction/own_records), is_system`. `User.roles = M2M(Role)`.
- **Faction scoping:** `User.factions = M2M(Faction)` + `ScopedQuerysetMixin` so a supervisor of faction A cannot read faction B's passports. More important here than the permission checkboxes.
- Enforced via a custom DRF permission class `HasPermission`. Django's built-in permissions kept only for the Django admin.
- **`user_type` migration:** data migration seeds four system roles (admin/supervisor/data_entry/viewer) and maps existing users; `user_type` kept but `editable=False` and `# DEPRECATED` for one release, removed later. Members are **data records, not login accounts** in v1.

**Audit:**
- `HistoricalRecords()` attached **per model** (not on `BaseModel`) with `excluded_fields=["updated_at"]`.
- `ActivityLog` (append-only, does **not** extend `BaseModel`): `actor, actor_username (snapshot), action, target_model, target_id, description, metadata, ip_address, user_agent, created_at`. Logs **reads too** — `document_download`, `print`, `export`, `login_failed` — because "who viewed whose passport" is the audit question that matters. No update/delete API.

---

## Security (non-negotiable for this data)

- **Private media:** `MEDIA_ROOT` outside any web root; **never** `static(MEDIA_URL)` outside DEBUG. All files served through `GET /api/documents/<id>/download/` which authenticates → checks `document.view` + faction scope → writes an `ActivityLog` row → returns the file (`X-Accel-Redirect`/`X-Sendfile` when a real webserver is available). Upload path `docs/%Y/%m/<uuid4>.<ext>` — never the original filename (PII + traversal risk).
- **Upload validation:** allowlist extension **and** sniff magic bytes (`%PDF-`, `PIL.verify()`); per-file size cap; strip EXIF from photos; serve a downscaled derivative by default, original only under `document.download_original`.
- **Print auth:** the print/PDF route needs auth; frontend fetches with the JWT header and opens the returned blob (works today; single-origin cookie deploy later makes it a plain link).
- **Backups encrypted** (age/gpg, key from env), off the DB disk, with a `BackupRecord` (sha256 + verify) and a **documented, tested restore drill**; downloads gated behind `backup.download` and logged.
- **Auth hardening:** logout endpoint that blacklists the refresh token; throttle on the login endpoint.

---

## Printing / PDF pipeline (`apps/reports/`)

Server-side, PDF is the single output. Two-stage pipeline handles the fact that documents may themselves be PDFs:
1. **Per selected section → standalone PDF bytes.** HTML sections (profile sheet, tasks, notes, evaluations, ID card) render a Django template through a `PdfRenderer` (WeasyPrint default). Image documents wrap in a one-page HTML header template. Sections whose source file is already a PDF are used directly.
2. **Concatenate** in chosen order with `pypdf`. This makes "each item on its own sheet" structurally guaranteed rather than dependent on CSS `break-after`.

- `GET /api/members/<id>/print/?sections=profile,passport,…` returns `application/pdf` (`inline`; `?download=1` → `attachment`). `?format=html` is a dev-only preview.
- Section registry in `apps/reports/sections.py` drives the popup + "select all".
- **Arabic in PDF:** embed **Cairo** font in the repo (`backend/static/fonts/`); `direction: rtl`; wrap every numeric run in `<bdi>`/`dir="ltr"` isolation so force/national numbers don't flip; keep dates explicit `Y-m-d`.
- **ID card:** `@page 85.6mm×54mm`, template accepts a **list** of members (batch N-up on A4 is the inevitable next request); optional QR of the force number. The seal (`images (1).jpeg`, 447×447) is usable for print crests ≤35mm; commission an **SVG** for screen/large print — do not AI-upscale the official seal.
- Renderer chosen via `REPORTS_PDF_ENGINE` setting; an `fpdf2` (pure-Python) fallback exists if a future host lacks WeasyPrint's system libs.
- Exports: `openpyxl` (write-only) for Excel member lists per faction/rank, with a row cap and streaming.

---

## Frontend

- **Router** (react-router-dom), **TanStack Query + axios** (JWT refresh interceptor), **react-hook-form + zod**, **shadcn/ui** (Radix `DirectionProvider dir="rtl"`), Tailwind 4 `@theme` tokens. Keep **oxlint** (already configured).
- **RTL:** `<html dir="rtl" lang="ar">` + `DirectionProvider`; use only **logical** Tailwind utilities (`ms/me/ps/pe/start/end`) — a stray `ml-4` mirrors wrong.
- **Latin numerals:** all number/date formatting through `src/lib/format.js` using `Intl.*("ar-LY-u-nu-latn")`; never call `Intl` directly elsewhere.
- **Font:** Cairo, self-hosted woff2.
- **Palette:** light = white/cream base; dark = navy blue; gold/black accents from the seal.
- **Layout:** collapsible sidebar → mobile drawer; fully responsive.
- **Dynamic member form** derived at runtime from `GET /api/settings/field-requirements/` in one place (`src/features/members/formSchema.js`) — form rendered from a field-config array, not hand-written.
- **Deploy target:** single-origin (`npm run build`, Django serves `index.html` via catch-all + WhiteNoise) to kill CORS and simplify auth/print — decided now since it shapes router/auth.

---

## Phased build order

Each phase is independently demoable. Working software first appears at the end of Phase 2.

**Phase 0 — Foundation fixes & hardening (2–3 days).** All fixes in the "Foundation fixes" section above. Files: `apps/core/middleware.py`, `apps/core/storage.py`, `apps/core/pagination.py`, `apps/core/views/auth.py` (logout), tests `test_history_user.py`/`test_soft_delete.py`; modify `apps/core/models/base.py`, `models/user.py`, `config/settings/*`, `requirements.txt`. **Demo:** `manage.py check --deploy` clean; a User edit via API produces a history row with the correct actor.

**Phase 1 — Organization, roles engine, app shell (1 week).** Backend `apps/organization/` (Rank, Faction, DocumentType), `apps/core/permissions/{registry,classes}.py`, `apps/core/models/role.py`, user-management views, data migration seeding roles + document types + mapping `user_type`. Frontend router/QueryClient/DirectionProvider, `@theme` palette + Cairo, `lib/api.js`, `lib/format.js`, `components/layout/{Sidebar,AppShell,MobileDrawer}`, auth + organization features. **Lands:** roles engine, sidebar, mobile responsive, dark/light. **Demo:** log in to the Arabic RTL shell, manage ranks and factions.

**Phase 2 — Member core CRUD + search (1.5 weeks) ← first real value.** `apps/members/` (member, document models, `utils/arabic.py`, serializers, views, `filters.py`), private `documents/<id>/download/`, Pillow thumbnail/EXIF. Frontend `MemberList/MemberForm/MemberDetail/DocumentUpload`. **Lands:** all member fields, photo, documents, search & filters by faction/rank/force number/national number, pagination. **Demo:** enter real members; search in Arabic and find them.

**Phase 3 — Settings: field requirements + role/user UI (4–5 days).** `field_registry.py`, `FieldRequirement` model + `sync_field_requirements`, settings views; frontend `FieldRequirements/Roles/SystemUsers`, `formSchema.js`. **Lands:** per-field required/optional checkboxes; system users with roles. **Demo:** toggle "passport" to required → form enforces it immediately.

**Phase 4 — Profile extras (1 week).** Note/Task/Evaluation/VacationRequest/VacationTransaction models + views; `Notification` model (task-assignment notifications). **Demo:** assign a task to a supervisor; they see the bell badge.

**Phase 5 — Printing, PDF, exports (1.5 weeks) ← the hard one.** `apps/reports/` renderers + `sections.py` + `composer.py` + print/export views + Excel; `templates/print/*`; Cairo fonts; page-count tests. Frontend `PrintDialog` (select-all, per-section, order). **Lands:** print popup, one sheet per item, clean print view, download as PDF, ID cards, Excel/PDF list exports. **Demo:** print a full profile — every section and scanned document on its own sheet.

**Phase 6 — Approval workflow + notifications (5 days).** `apps/workflow/` approval + notification models/services; frontend approval queue + notification centre. Creator cannot approve own submission. **Demo:** data-entry creates member → pending → supervisor approves → active; both notified.

**Phase 7 — Audit UI, expiry alerts, backups, cron (1 week).** `ActivityLog` + signals; `HistoricalRecords` on chosen models; unified audit feed view; `check_document_expiry`, `accrue_vacation`, `backup_db`/`restore_db` commands; `ScheduledJobRun` (detect silent cron death) + `DocumentExpiryAlert` (idempotent); `deploy/crontab.example`. Frontend audit + Backups pages. **Demo:** change a rank → see it in the audit log with actor; see passports expiring in 60 days; trigger + download an encrypted backup.

**Phase 8 — Hardening & deploy (5 days).** Indexes + query profiling, `select_related`/`prefetch_related`, code splitting, permission-matrix test suite, SVG logo + icons, `deploy/` runbook (nginx + gunicorn + systemd, no Docker), restore drill.

---

## Verification

- **Per phase:** `manage.py check --deploy`; `manage.py test`; manual demo above.
- **Critical tests:** (a) `history_user` correctly attributed on API writes; (b) role × endpoint permission matrix (200/403); (c) soft-delete + unique-number reuse; (d) merged-PDF page count equals expected sheet count; (e) Arabic search normalization (`احمد` matches `أحمد`).
- **End-to-end smoke:** create member with documents → search → assign task (notification) → submit for approval → approve → print full profile (verify each item on its own sheet, Latin numerals, correct RTL) → export faction list to Excel → run backup → confirm audit log shows every actor.
- **Frontend:** `npm run build` + `npm run lint`; manual RTL/mobile-drawer/dark-mode check; verify numerals stay Latin everywhere.
