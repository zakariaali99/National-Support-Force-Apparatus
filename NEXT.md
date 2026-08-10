# Handoff — What's Left

Last updated: after Phase 2 (member core CRUD + search).
Full plan: [PLAN.md](PLAN.md).

## Current state

- Backend: Django REST app, PostgreSQL (`nsfa_dev` locally, role `nsfa`/`nsfa`). Runs with
  `cd backend && source venv/bin/activate && python manage.py runserver 127.0.0.1:8000`.
- Frontend: React 19 + Vite + Tailwind 4. Runs with `cd frontend && npm run dev` (proxies `/api` to :8000).
  `.claude/launch.json` has a `frontend` preview config for the Browser-pane tool.
- Local Postgres: started via `pg_ctl -D /opt/homebrew/var/postgresql@14 -l /opt/homebrew/var/log/postgresql@14.log start`
  (NOT `brew services` — broken on this machine).
- A `smoketest` / `SmokeTest123!` Django superuser exists in the dev DB.
- All 45 backend tests pass (`python manage.py test`), `manage.py check --deploy` clean under a simulated
  production env, `manage.py spectacular` clean (no schema warnings — keep it that way, see "Conventions"
  below), frontend builds and lints clean.
- Live-verified in the browser this session: login, RTL/dark-light theme, ranks/factions CRUD, permission
  gating, member create/list/detail with rank/faction names resolving correctly, document-type dropdown.

## Done: Phases 0-2

**Phase 0** — audit-trail/JWT middleware fix, soft-delete `_base_manager` fix, conditional unique
constraints, `phone` field fix, settings hardening.

**Phase 1** — `apps/organization` (Rank, Faction, DocumentType — 3 system-seeded types: birth_certificate,
passport, national_id_paper), `apps/core` permission registry + `Role` model + `HasPermission` /
`ScopedQuerysetMixin`, 4 seeded system roles (admin/supervisor/data_entry/viewer), `/api/auth/me/`,
frontend RTL shell (sidebar/drawer/theme/login).

**Phase 2** — `apps/members`:
- `Member` model: 4 name fields + `search_name` (Arabic-normalized via `apps/members/utils/arabic.py`),
  photo + photo_thumb (private storage, EXIF-stripped/downscaled via `apps/members/utils/uploads.py`),
  force_number/national_number (conditional-unique, Arabic-Indic digit normalization on input),
  date_of_birth, blood_type, rank/faction FKs, phone, pledges, join_date, `approval_status` +
  `service_status` (two separate enums), vacation_balance_days (placeholder for Phase 4).
- `MemberDocument` model: generic by `document_type`, content-sniffed (magic bytes, not trusted
  extension), sha256, private storage. Served only via `GET /api/documents/<id>/download/`
  (authenticated + permission-checked + faction-scope-checked; `_log_document_access()` hook in
  `apps/members/views/document.py` is a deliberate no-op — Phase 7 fills it in).
- Faction-scoped API (`ScopedQuerysetMixin` on `MemberViewSet`) — a supervisor only sees their assigned
  faction's members.
- Frontend: `MemberList` (search/filter/paginate), `MemberForm` (create/edit, all fields, photo upload),
  `MemberDetail` (profile + documents), `DocumentUpload` widget. `AuthedImage` component +
  `fetchAuthedBlobUrl()` helper for rendering/downloading private files (plain `<img src>` can't send the
  JWT header).
- 19 new tests: Arabic search matching, soft-delete-then-reuse of force/national numbers, faction scoping
  (3 role scopes), upload content-sniffing (rejects spoofed extension), digit normalization, permission
  gating, approval_status not editable via plain PATCH.

**Reusable pieces future phases should use, not rewrite** (in addition to Phase 0/1's list in git history):
- `apps/core/permissions/classes.py::user_can_access_faction(user, faction_id)` — single-object faction
  check for plain APIViews (see `MemberDocumentDownloadView`); `ScopedQuerysetMixin` is the queryset-level
  equivalent.
- `apps/members/utils/arabic.py::normalize_ar()` / `normalize_digits()` — reuse for ANY future
  Arabic-text search or numeric-ID field (e.g. passport_number if ever added).
- `apps/members/utils/uploads.py::sniff_content_type() / validate_upload_size() / compute_sha256() /
  process_photo()` — reuse verbatim for any future file upload (evaluation attachments, etc. if they ever
  need files).
- `frontend/src/components/ui/AuthedImage.jsx` + `fetchAuthedBlobUrl` (`features/members/api.js`) — use for
  any future private-file preview/download.
- `frontend/src/components/ui/Select.jsx`, `Textarea.jsx` — native-element wrappers, added this phase.
- `Button asChild` (via `@radix-ui/react-slot`, installed this phase) — use for any Link-styled-as-button.

## Conventions established — follow these in every remaining phase

- **DRF schema must stay clean.** Every `SerializerMethodField` needs `@extend_schema_field`; every plain
  `APIView` (not ModelViewSet) needs `@extend_schema(...)` if DRF can't infer it. Verify with
  `python manage.py spectacular --file /dev/null` — it must produce NO output (warnings surface in
  `manage.py check` too, which is part of the Phase-end verification checklist below). Get this wrong and
  a future phase's `check --deploy` gate silently starts failing.
- **Raise `serializers.ValidationError` (or catch `django.core.exceptions.ValidationError` and re-raise
  as DRF's) only from `validate()`/`validate_<field>()`, never from `create()`/`update()`.** DRF does not
  catch exceptions raised during `.save()` — they surface as a raw 500. This bit the document-upload
  serializer this phase (see `apps/members/serializers/document.py` — sniffing moved into `validate_file`).
- **Permission scope defaults to `own_faction`.** A freshly-created `Role` with no explicit `scope` kwarg
  needs either `scope="all"` or the test user needs `user.factions.add(...)`, or every list/detail call
  returns empty/404. Two Phase-2 tests broke on exactly this before being fixed — don't re-learn it.
- **`SoftDeleteModelViewSet.perform_destroy` soft-deletes; write tests with `Model.all_objects`, not
  `Model.objects`, to assert the row still physically exists.**
- Every new app: register in `INSTALLED_APPS` (`config/settings/base.py`), add its `urls.py` to
  `config/urls.py` under `path("api/", include(...))`, register models in `admin.py`.

## Next: Phase 3 — Settings: field requirements + role/user UI (not started)

Per PLAN.md, two halves:

**Backend (mostly new):**
- `apps/members/field_registry.py`: canonical list of Member fields — key, `label_ar`, type
  (text/number/date/select/textarea/image/file), `default_required` (bool), `lockable` (bool — structural
  fields: first_name, second_name, last_name, force_number, national_number, rank, faction must be
  `lockable=False`, i.e. always required, can't be toggled off in the UI).
- `apps/core/models/field_requirement.py::FieldRequirement`: `field_key` (unique), `is_required`,
  `is_visible`, `order`. Mutable overrides ONLY — the registry above is the source of truth for what
  fields *exist*; this table only overrides required/visible/order per field.
- `management/commands/sync_field_requirements.py`: idempotent — for every key in the registry not yet in
  `FieldRequirement`, create a row from `default_required`; don't touch existing rows. Run on deploy (call
  it from a data migration too, so `migrate` alone gives a working default set).
- `GET /api/settings/field-requirements/` (list, cached — plan says `cache.get_or_set`, invalidate on
  `post_save` of `FieldRequirement`) + `PATCH` per row (permission: `settings.manage`, already in the
  registry from Phase 1 — nothing to add there).
- Enforce in `MemberSerializer`: on **create**, any `is_required=True` field missing from the payload is a
  validation error; on **PATCH**, only validate fields present in the payload (so tightening a
  requirement doesn't lock existing incomplete records out of being edited at all). Expose
  `missing_required_fields` computed from this — the field already exists on `MemberSerializer`
  (`apps/members/serializers/member.py`) returning `[]` as a placeholder; wire it to the real check here.
- Role/User management: **the API already exists** (`RoleViewSet`/`UserViewSet` in
  `apps/core/views/role.py` / `user.py`, wired at `/api/roles/` and `/api/users/` since Phase 1) — this
  phase is purely the frontend UI for it, no backend work needed there. `RoleViewSet` also exposes
  `GET /api/roles/permissions/` returning the grouped permission registry for the checkbox UI.

**Frontend (`src/features/settings/`):**
- `FieldRequirementsPage.jsx` — table of fields (label, required toggle, visible toggle), disabled/locked
  rows for `lockable=False` fields with a tooltip explaining why.
- `RolesPage.jsx` — list roles, create/edit with the permission checkboxes grouped exactly as
  `PERMISSION_GROUPS` returns them (group key → Arabic group label → checkboxes), scope selector,
  `is_system` roles read-only-name but still permission-editable (matches backend: `RoleViewSet` blocks
  delete of `is_system`, not edit).
- `SystemUsersPage.jsx` — list/create/edit users, role assignment (multi-select), faction assignment
  (multi-select, relevant when the assigned role(s) have `scope="own_faction"`), activate/deactivate
  (soft "delete" — `UserViewSet.perform_destroy` already sets `is_active=False`, doesn't hard-delete).
- `src/features/members/formSchema.js` — build the zod schema and visible-field list for `MemberForm.jsx`
  from `GET /api/settings/field-requirements/` at runtime, replacing the currently-hardcoded schema in
  `MemberForm.jsx`. Keep the field *rendering* (each `<Field>` block) as-is; only required-ness and
  visibility become data-driven. Structural fields stay hardcoded-required regardless of what the API
  says (defense in depth, matches backend `lockable`).
- Add "الإعدادات" (Settings) section to `navConfig.js`, gated by `settings.manage` / `roles.manage` /
  `users.manage` as appropriate per sub-page (don't show the sidebar item to users without at least one of
  those permissions — `useAuth().hasPermission` already supports this per-item, see existing gating
  pattern in `RanksPage.jsx`).

**Tests to write:** `sync_field_requirements` is idempotent (run twice, no duplicate/changed rows); a
required-but-missing field is rejected on create; the same field missing on PATCH of an existing record is
NOT rejected; a `lockable=False` field cannot be toggled via the API even if someone tries; role
permission-checkbox save round-trips correctly; `UserViewSet` delete deactivates not hard-deletes.

**Verification**: backend test suite, `check --deploy`, `spectacular` clean, frontend build+lint, then a
live browser pass — toggle a field required in Settings, confirm `MemberForm` enforces it immediately;
create a role with 2 permissions, assign to a test user, confirm their UI reflects exactly those 2.

## After Phase 3, in order (see PLAN.md for full detail on each)

- **Phase 4** — `MemberNote`, `MemberTask`, `MemberEvaluation`, `VacationRequest`, `VacationTransaction`
  models (all `apps/members/models/`, BaseModel + HistoricalRecords like Member); `apps/workflow` app (new)
  with `Notification` model, in-app only, polled every 45-60s via TanStack Query on the frontend (no
  websockets). `Member.vacation_balance_days` becomes a real denormalized cache updated inside
  `transaction.atomic()` + `select_for_update()` when a `VacationTransaction` is written.
- **Phase 5** — `apps/reports/` app (new): WeasyPrint renderer (already verified working in this dev
  environment — see Phase 0 setup) + pypdf composer, two-stage pipeline (HTML sections rendered to PDF;
  sections whose source file is already a PDF pass through directly — see PLAN.md, do NOT try to inline a
  PDF into an HTML `<img>`). Cairo font files already exist at `frontend/src/assets/fonts/` — copy/symlink
  the same `.woff2` files (or re-fetch, same Google Fonts URLs are in this session's history) into
  `backend/static/fonts/` for the PDF templates. Section registry drives the print popup + "select all".
  Excel export via openpyxl write-only mode.
- **Phase 6** — `apps/workflow` approval models (draft→pending→approved/rejected transitions via dedicated
  endpoints, NOT plain PATCH — `Member.approval_status` is already read-only on the plain serializer from
  Phase 2, by design, exactly so Phase 6 can own the transition). Creator cannot approve their own
  submission — enforce in a permission class, not just hidden UI.
- **Phase 7** — `ActivityLog` model (`apps/core/models/activity_log.py`, append-only, do NOT extend
  `BaseModel` — no soft-delete on an audit log). Wire `_log_document_access()` in
  `apps/members/views/document.py` (currently a no-op, deliberately left as the single call site). Attach
  `HistoricalRecords` audit UI (history already being recorded since Phase 1/2 on Rank/Faction/DocumentType/
  Member/MemberDocument — just needs a UI to browse it). `check_document_expiry` / `accrue_vacation` /
  `backup_db` / `restore_db` management commands, `ScheduledJobRun`, encrypted backups.
- **Phase 8** — code splitting (frontend bundle is 574KB single-chunk, flagged since Phase 1, not yet
  fixed — do it here, not before), DB index/query audit, permission-matrix test suite across all
  roles × endpoints, SVG version of the seal logo (current `nasf-seal.jpg` is 447×447, fine for the sizes
  used so far — favicons, login/sidebar avatars, ≤80px — but Phase 5's ID card and Phase 8's letterhead
  need higher fidelity), `deploy/` runbook (nginx + gunicorn + systemd, no Docker).

## Open decisions still deferred by the user (do not assume — ask if they become blocking)

- Final hosting target (VPS vs shared) — user said "local only for now."
- Already answered, do NOT re-ask: Arabic RTL + Latin numerals, server-side PDF, Postgres (dev+prod),
  custom roles with checkboxes, blood type + DOB added to Member (not gender), force_number globally
  unique, no re-approval on edit after approval, in-app-only notifications.

## Known rough edges to fix opportunistically (not blocking)

- Frontend production bundle is a single 574KB chunk (Phase 8 fixes this).
- `MemberDetail.jsx` has no notes/tasks/evaluations/vacation tabs yet — Phase 4 adds them directly to this
  file, no restructuring needed first.
- No print button on `MemberDetail.jsx` yet — Phase 5 adds it.
- `MemberForm.jsx`'s zod schema is currently hardcoded (all fields required per PLAN.md's original field
  list except third_name/phone/pledges/dates/blood_type) — Phase 3 makes this data-driven, see above.
