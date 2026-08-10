# Handoff — Project Status

Last updated: after Phase 8 (hardening & deploy) — **all 8 phases in PLAN.md are now implemented.**
Full plan: [PLAN.md](PLAN.md).

## Current state

- Backend: Django REST app, PostgreSQL (`nsfa_dev` locally, role `nsfa`/`nsfa`). Runs with
  `cd backend && source venv/bin/activate && python manage.py runserver 127.0.0.1:8000`.
- Frontend: React 19 + Vite + Tailwind 4. Dev: `cd frontend && npm run dev` (proxies `/api` to :8000).
  Production: `npm run build` — the app is now code-split (Phase 8), and Django serves it single-origin
  (see "Single-origin deploy" below) — `.claude/launch.json` has a `frontend` preview config for the
  Browser-pane tool.
- Local Postgres: `pg_ctl -D /opt/homebrew/var/postgresql@14 -l /opt/homebrew/var/log/postgresql@14.log start`
  (NOT `brew services` — broken on this machine). **Note:** `backend/config/settings/development.py` was
  found locally modified to SQLite at the start of this session (uncommitted, contradicting this project's
  documented "Postgres in dev too" decision and silently breaking `JSONField __contains` queries used by
  the approval-workflow notifications) — it was reverted to the committed Postgres config. If dev ever
  breaks with a "contains lookup is not supported" error, check this file hasn't drifted again.
- A `smoketest` / `SmokeTest123!` Django superuser exists in the dev DB; `seed_system` management command
  seeds a fuller demo dataset (admin/admin123 + ranks/factions/roles/members).
- **153 backend tests pass** (`python manage.py test`), `manage.py check --deploy` clean, `manage.py
  spectacular` clean (no schema warnings), frontend `npm run build`/`npm run lint` clean.
- **Verification method this session:** the Browser-pane preview tool was unavailable for this entire
  session (2026-08-10) — Phases 3 through 8 were all verified via automated checks only (backend test
  suite including real `pg_dump`/`psql`/WeasyPrint/openpyxl round trips, `check --deploy`, schema
  generation, frontend build+lint, and one manual restore drill against a throwaway Postgres database —
  see Phase 7/8 below). **No phase in this range has been clicked through in an actual browser.** This is
  the single most important thing to do next: open the app and click through each phase's demo criteria
  (listed in PLAN.md's "Phased build order" section) before treating any of them as fully done.

## Done: Phases 0-8 (all of PLAN.md)

**Phases 0-3** — see git history and earlier versions of this file for full detail. Summary: foundation
fixes (JWT audit middleware, soft-delete manager fix, conditional unique constraints), organization app +
roles engine + RTL app shell, member core CRUD + Arabic search + private documents, settings (field
requirements + roles/users UI).

**Phase 4 — Profile extras.** `MemberNote`/`MemberTask`/`MemberEvaluation`/`VacationRequest`/
`VacationTransaction` models; `apps/workflow` app with `Notification` (polled, `refetchInterval: 45s`, no
websockets) — `NotificationBell` in the header, 4-tab `ProfileExtras` card on `MemberDetail`. Vacation
balance is a denormalized cache kept correct by
`apps/members/services/vacation.py::apply_vacation_transaction()` (`transaction.atomic()` +
`select_for_update()`). Task assignment/reassignment auto-notifies the assignee. Added
`GET /api/users/assignable/` (any authenticated user, minimal shape) so task-assignment pickers don't need
full `users.manage`.

**Phase 5 — Printing, PDF, exports.** `apps/reports/` app: WeasyPrint renderer
(`apps/reports/renderer.py`, Cairo font embedded via `backend/static/fonts/`, `REPORTS_PDF_ENGINE` setting)
+ `apps/reports/composer.py` (pypdf concatenation — each section/document its own sheet, PDF-source
documents pass through untouched, image documents wrap in a one-page HTML template). Section registry
(`apps/reports/sections.py`) drives `GET /api/reports/sections/` and the frontend's `PrintDialog`.
`GET /api/members/<id>/print/?sections=...&documents=...` (`&download=1`, `&preview=1` for a dev-only
single-section HTML view — **not** `?format=html`, that collides with DRF's own content-negotiation query
param and 404s). Batch ID cards (`GET /api/members/id-cards/?ids=...&qr=1`, 85.6×54mm pages, optional QR of
force_number). Excel export (`GET /api/members/export/`, openpyxl write-only, `MAX_EXPORT_ROWS = 5000` hard
cap surfaced via `X-Export-Truncated` header). `MemberList` has an "Export Excel" button honoring active
filters; `MemberDetail` has the print dialog.

**Phase 6 — Approval workflow: implemented, then reverted at user request (both on 2026-08-10).** The
`submit`/`approve`/`reject` actions on `MemberViewSet`, the `/members/approvals` queue page, and the
submit/approve/reject buttons on `MemberDetail` were built, then explicitly removed the same session after
the user asked for it — they hadn't asked for this specific feature; it came from interpreting an earlier
"continue and finish all phases" instruction more literally than intended. **Do not rebuild this without a
fresh, explicit request** — PLAN.md's Phase 6 checkbox is unchecked again with a note pointing here.
What's still in place (deliberately, see the removal's scope notes): `Member.approval_status` itself (the
field/enum/badge — Phase 2 scaffolding, predates Phase 6, stays read-only on `MemberSerializer` with no way
to transition it via the API, which is simply its pre-Phase-6 state); the unrelated vacation-request
approve/reject feature (Phase 4, a different workflow entirely); the `member.approve` permission codename
in `apps/core/permissions/registry.py` (predates Phase 6 too, harmless unused-for-now placeholder);
`apps/workflow/services.py` (`notify`/`notify_many`/`users_with_permission_in_faction` — still used by
Phase 7's `check_document_expiry`); the "بانتظار الاعتماد" pending-count KPI card on `DashboardPage.jsx`
(predates this session's work entirely — left alone since it wasn't mine to remove, but it will now always
read 0 since nothing moves a member to "pending" anymore).

**Phase 7 — Audit UI, expiry alerts, backups, cron.** `ActivityLog` model (`apps/core/models/activity_log.py`
— append-only, NOT a `BaseModel`, written only via `apps.core.activity.log_activity`) now actually logs
`document_download` (the Phase-2 `_log_document_access` hook is wired), `print`, `export`, `login_failed`
(had to catch the exception `TokenObtainPairView.post()` raises on bad credentials — it doesn't return a
plain non-200 response, see `apps/core/views/auth.py`). `GET /api/audit/activity/` (permission `audit.view`)
+ `GET /api/audit/history/?model=member&id=5` (field-level diffs from the `HistoricalRecords` already
attached since Phase 1/2 — `simple_history`'s `diff_against()`, registry in `apps/core/views/audit.py`).
Frontend `AuditPage` + a `HistoryDialog` wired onto `MemberDetail`. `ScheduledJobRun` model
(`apps/core/models/scheduled_job.py`) gives every cron command idempotency-per-period AND dead-cron
detection (query the latest run per `name`, compare to how often it should fire). `DocumentExpiryAlert`
(`apps/members/models/`) makes `check_document_expiry` idempotent per (document, expiry_date).
`accrue_vacation` grants `MONTHLY_ACCRUAL_DAYS = 2` to active members, idempotent per calendar month.
Encrypted backups: `backup_db`/`restore_db` commands (`apps/core/management/commands/`), `BackupRecord`
model, `apps/core/backup_crypto.py`. **Deviation from PLAN.md:** uses Python's `cryptography` package
(Fernet) instead of shelling out to `age`/`gpg` binaries — neither is guaranteed present on a bare VPS
without an extra system package, `cryptography` ships as a normal wheel; same guarantee (unreadable without
`BACKUP_ENCRYPTION_KEY`, key never touches the DB disk). `restore_db` takes `--file <path>` as the primary
interface (not just `--backup-id`, which is an ORM lookup against the *currently connected* DB — useless in
a real disaster where that DB, and its `BackupRecord` table, no longer exists). **The restore drill was
actually run** during this session against a throwaway `nasf_restore_drill` Postgres database — real
`pg_dump` → Fernet-encrypt → decrypt → `psql` restore, verified with a direct `SELECT count(*)` — not just
written up. Frontend `BackupsPage` (run/list/download, staleness banner if the latest backup is >36h old).
`deploy/crontab.example` wires all three jobs.

**Phase 8 — Hardening & deploy.** Frontend code-split via `React.lazy`/`Suspense` per route in `App.jsx` —
the flagged 662KB single chunk is now a 451KB main chunk + per-route chunks (2-30KB each), and the
build-time "chunk larger than 500KB" warning is gone. Fixed a real bug this surfaced work adjacent to:
`UserViewSet` paginated an unordered queryset (`UnorderedObjectListWarning`) — added `ordering =
["username"]`. Permission-matrix test suite (`apps/core/tests/test_permission_matrix.py`) — derives
expectations from `SYSTEM_ROLE_PRESETS` itself rather than hardcoding them, so it keeps failing loudly if a
preset's permissions change. **Single-origin production deploy actually implemented, not just planned:**
`FRONTEND_DIST`/`WHITENOISE_ROOT` settings + a `SPAIndexView` catch-all in `config/urls.py` (must stay last;
serves `frontend/dist/index.html` for any non-`/api/`/non-`/admin/` path so React Router survives a hard
refresh) — verified end-to-end this session: WhiteNoise correctly serves a real built JS asset (200,
correct content-type) and the catch-all correctly returns the SPA shell for a client route while leaving
`/api/auth/me/` alone (401, not swallowed). `deploy/README.md` — full runbook (Postgres setup, gunicorn +
systemd unit, nginx + certbot, cron install, redeploy steps) plus the restore-drill section referenced
above. **Known gap, deliberately not done:** an SVG version of the seal logo — the current
`frontend/src/assets/nasf-seal.jpg` (447×447) is fine for the small sizes used throughout (favicons,
sidebar/login avatars, ID cards ≤35mm) but commissioning a proper vector redraw of an official government
seal is real graphic-design work, not something to fabricate from a code-agent session. Do this with an
actual designer before any large-format print use (letterhead, posters).

## Conventions established — follow these in every future change

(Carried forward from Phase 3, still true, now with a few more entries.)

- **DRF schema must stay clean.** Every `SerializerMethodField` needs `@extend_schema_field`; every plain
  `APIView` needs `@extend_schema(...)`. Verify with `python manage.py spectacular --file /dev/null` — must
  produce NO output.
- **Raise `serializers.ValidationError` only from `validate()`/`validate_<field>()`, never `create()`/
  `update()`.**
- **Permission scope defaults to `own_faction`** — a fresh `Role` with no `scope` kwarg needs either
  `scope="all"` or `user.factions.add(...)`.
- **`SoftDeleteModelViewSet.perform_destroy` soft-deletes**; assert on `Model.all_objects`, not
  `Model.objects`, in tests.
- Every new app: register in `INSTALLED_APPS`, wire its `urls.py` under `path("api/", include(...))` in
  `config/urls.py`, register models in `admin.py`.
- **Approval-status-like fields (workflow state machines) are never plain-PATCH-writable** — always a
  dedicated action/endpoint with its own permission and transition validation. `Member.approval_status` and
  `VacationRequest.status` both follow this; keep doing it for any future state machine.
- **DRF's `?format=` query param is reserved by content negotiation** — don't name a custom query param
  `format`; it 404s. Learned the hard way on the print endpoint's dev-preview flag (now `?preview=1`).
- **`django-simple-history` fields on possibly-`None` FKs**: don't chain `{{ x.related.field|default:...
  }}` in a Django template when `x.related` can be `None` — it raises `VariableDoesNotExist` inside a
  filter argument instead of resolving to empty. Guard with `{% if x.related %}`.
- **`TokenObtainPairView.post()` raises `AuthenticationFailed` directly** rather than returning a non-200
  response — anything hooking into login (rate limiting is already there; audit logging now too) must wrap
  `super().post()` in try/except, not check `response.status_code` after the fact.
- **Reusable pieces future work should use, not rewrite:** `apps.core.permissions.classes.
  scope_queryset_to_user_factions()` (the plain-function counterpart of `ScopedQuerysetMixin`, for APIViews
  that aren't ViewSets — see `apps/reports/views.py`); `apps.core.activity.log_activity()` (the only way to
  write an `ActivityLog` row); `apps.core.models.ScheduledJobRun` (idempotency + dead-cron detection for
  ANY future periodic command, not just the three that exist today).

## What's left / next steps

PLAN.md's 8 phases are all implemented. What remains is verification and polish, not new features:

1. **Live browser verification** (see "Current state" above — this is the priority). Walk through every
   phase's demo criteria in PLAN.md's "Phased build order" section in an actual running browser. Nothing
   from Phase 3 onward has been visually confirmed working this session.
2. **SVG seal logo** — needs a human designer, not a code session (see Phase 8 above).
3. Everything else called out as "not yet done" or "future work" inline in the summaries above (fpdf2
   fallback renderer, N-up ID card layout, gunicorn/nginx actually deployed to a real VPS rather than just
   documented) is optional polish beyond what PLAN.md asked for — revisit only if actually needed.

## Open decisions still deferred by the user (do not assume — ask if they become blocking)

- Final hosting target (VPS vs shared) — user said "local only for now." `deploy/README.md` documents a
  generic VPS target per PLAN.md's decision but nothing has been deployed anywhere.
- Already answered, do NOT re-ask: Arabic RTL + Latin numerals, server-side PDF, Postgres (dev+prod),
  custom roles with checkboxes, blood type + DOB added to Member (not gender), force_number globally
  unique, no re-approval on edit after approval, in-app-only notifications, single-origin deploy.
