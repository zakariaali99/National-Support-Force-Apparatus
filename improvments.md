# NSFA — Improvements Plan (Phase 1–4)

Follow-up to `SYSTEM_TEST_REPORT.md` Section B. All A.1–A.8 fixes are implemented and verified; this plan covers the four selected long-term items:

1. **Backup/DR — images in backups** (report item 12)
2. **Audit hardening** (report item 9)
3. **Document integrity** (report item 10)
4. **Testing — reports + settings coverage** (report item 14)

Decisions locked:
- Equipment/Vehicle image fields are **deferred** (pipeline will be generic for future fields)
- Frontend smoke test = **Playwright E2E spec** (reuses existing dep)
- Download link expiry = **one-time signed tickets included**

---

## Phase 1 — Backup/DR with media

Current state: `.sql.enc` = single encrypted `dumpdata`/`pg_dump` blob. Gaps: media never included (`private_media/` — member photos/pledges/documents); soft-deleted members excluded (`dumpdata` uses default `objects` = `SoftDeleteManager`, no `--use-base-manager`); `equipment`/`transportation`/`attendance` apps not in dump list; `merge_json_backup` ignores photos, `MemberDocument`, pledge attachments, forces `is_deleted=False`; no scheduler (only `ScheduledJobRun` guard).

1. **`backend/apps/core/management/commands/backup_db.py`**
   - Add `--use-base-manager` to `dumpdata` → soft-deleted rows included
   - Extend app list: `equipment`, `transportation`, `attendance`
   - New output format: encrypted ZIP containing `db.json` + `manifest.json` + `media/<relative path>`
   - Media enumerated from `all_objects` querysets: `Member.photo`, `Member.photo_thumb`, `MemberPledge.attachment`, `MemberDocument.file` (incl. deleted members')

2. **`backend/apps/core/services/backup_media.py`** (new)
   - Collect/verify media files, build manifest (relative path + sha256 + size)

3. **`backend/apps/core/management/commands/restore_db.py`**
   - Sniff magic bytes: `PK` (zip) vs `{` (JSON) vs SQL
   - Extract to temp dir → `loaddata db.json` → materialize media files (verify manifest hashes)
   - Old single-blob backups remain restorable

4. **`backend/apps/core/services/backup_merge.py`**
   - Lookups via `all_objects` (soft-deleted row must not duplicate)
   - Honor `is_deleted`/`deleted_at` from dump (don't force False)
   - Restore `photo`/`photo_thumb`/pledge `attachment` paths
   - Add `MemberDocument` merge handling

5. **Migration**: `BackupRecord.format` + `BackupRecord.media_count`

6. **Docs/config**
   - `.env.example`: document `BACKUP_ENCRYPTION_KEY` (currently falls back to `DJANGO_SECRET_KEY`) and `BACKUP_ROOT`
   - `deploy/crontab.example`: daily `0 2 * * * backup_db` (no celery in this repo; `ScheduledJobRun` guard already prevents double-runs)

7. **Tests** (`apps/core/tests/test_backup.py`): media round-trip (member + photo → backup → restore), deleted member preserved, old-format restore still works

## Phase 2 — Audit hardening

Current state: `ActivityLog` has `metadata` JSON (no hash column); all 45 call sites capture IP; serializer masks IP/UA for non-superusers; CSV adds raw IP column for superusers only; **5 of 8 report endpoints log nothing** (custody voucher, trip ticket, daily/monthly attendance, inventory summary); Content-Disposition filenames interpolate unvalidated client query params (`voucher_number`, `trip_number`).

1. **Migration**: `ActivityLog.payload_hash` (CharField 64) — sha256 of response bytes on download/print/export actions

2. **Audit the 5 silent report endpoints** (`CustodyVoucherPdfView`, `VehicleTripTicketPdfView`, `DailyAttendancePdfView`, `InventorySummaryPdfView`, `MonthlyAttendancePdfView` in `backend/apps/reports/views.py`) — `print`/`export` entries with `payload_hash`

3. **`attachment_filename()` helper** (reports app) — control-char stripping, RFC 5987 `filename*`; stop trusting client-supplied `voucher_number`/`trip_number` in header filenames

4. **CSV IP masking** (`ActivityLogViewSet.export_csv`, `backend/apps/core/views/audit.py`): superuser IPs get last-octet masking; column stays absent for non-superusers

5. **`SignedDownloadToken`** model (new migration): one-time, 5-min expiry, target-scoped; wired into `MemberDocumentDownloadView` (`backend/apps/members/views/document.py`) + `BackupDownloadView` (`backend/apps/core/views/backup.py`); serializer whitelist updated for `payload_hash`

6. **Tests**: masking, hash presence, header-injection sanitization, ticket expiry + one-time use

## Phase 3 — Document integrity

Current state: numbers are `strftime`-generated per render (minute granularity, collide-prone), VCH/TRIP client-spoofable, not persisted; monthly attendance has no number; no footer hash anywhere.

1. **`DocumentIssueRecord`** model + migration (reports app): `doc_type`, `issue_number` (atomic per-type sequence via `select_for_update`), `issued_by`, `issued_at`, `sha256` (rendered PDF bytes), `target_ref` (date/member/voucher…)

2. **Replace strftime numbering** in `backend/apps/reports/views.py` (VCH-/TRIP-/ATT-/INV-; add number to monthly attendance; stop accepting client-supplied numbers) — e.g. `VCH-260820-0007`

3. **Tamper-evident footer** — inject doc number + short payload hash line centrally in `backend/apps/reports/renderer.py` before `render_html_to_pdf`

4. **Verify endpoint** (optional): `GET /api/reports/verify/<doc_type>/<number>/` → stored hash + issued_at

5. **Tests**: sequence atomicity (no gaps under concurrency), footer present, hash matches stored

## Phase 4 — Testing

Current state: 168 tests pass via `manage.py test` (unittest, no pytest installed); zero frontend tests (no vitest; Playwright already a devDependency).

1. **Backend** (unittest via `manage.py test`, no new deps)
   - `apps/reports/tests/test_pdf_endpoints.py`: every PDF endpoint → 200 + `%PDF-` magic; `?html=1` → `text/html`; 401 without token
   - Renderer fail-loud: both engines mocked failing → `RuntimeError`
   - New tests from Phases 1–3

2. **Frontend Playwright E2E** — `frontend/e2e/routes.spec.ts`
   - Admin login → 18-route sweep asserting no ErrorBoundary / no `حدث خطأ` (would have caught A.1)
   - viewer1 `/settings` denial-toast assertion
   - Add `test` script to `frontend/package.json`

3. **Full verification run**: `manage.py test` (168 + new) + `npm run lint` + `npx playwright test`

---

## Execution order & notes

- Phase 1 → 2 → 3 → 4 (each phase lands with its tests)
- **Deferred:** InventoryItem/Vehicle image fields (pipeline generic for future fields); containerization/celery (separate task)
- Key reference files: `backend/apps/core/views/backup.py`, `backend/apps/core/services/backup_merge.py`, `backend/apps/reports/views.py`, `backend/apps/reports/renderer.py`, `backend/apps/core/models/activity_log.py`, `backend/apps/core/views/audit.py`, `backend/apps/core/serializers/audit.py`, `backend/templates/print/*`