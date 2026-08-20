# تقرير الاختبار الشامل — نظام الجهاز الوطني للقوى المساندة (NSFA)
### Comprehensive System Test Report — National Support Force Apparatus (NSFA)

- **Date:** 2026-08-20
- **Environment:** `http://localhost:8000` (Django + built SPA, single origin), Vite dev at `:5173`
- **Tester:** automated QA (Playwright MCP browser) + API-level verification
- **Scope:** all pages, buttons, features, filters, every downloadable official paper (PDF/Excel/CSV/encrypted backup), downloaded artifacts scanned for integrity

---

## Section A — Errors, Problems & Findings

### A.1 Critical — Two settings pages crash (JavaScript runtime error)

| # | Page | Error | Root cause |
|---|------|-------|-----------|
| 1 | `/settings/armory-categories` | `ReferenceError: useEffect is not defined` (red ErrorBoundary screen, page unusable) | `frontend/src/features/settings/ArmoryCategoriesPage.jsx` uses `useEffect` (line 79) but imports only `{ useState, useMemo }` from `"react"` |
| 2 | `/settings/inventory-categories` | `ReferenceError: useEffect is not defined` (same) | `frontend/src/features/settings/GeneralInventoryCategoriesPage.jsx` — same missing import |

- Confirmed in console log: both errors fired at page load with full component stack (`ArmoryCategoriesPage-CQk1Bbsj.js`, `GeneralInventoryCategoriesPage-BlA3L0Xc.js`).
- All other 22 routes load clean (Phase 2 sweep).
- **Fix:** add `useEffect` to the react import in both files, rebuild, retest. (Not modified during this test session — test-only, no code changes were made.)

### A.2 Daily attendance sheet PDF prints EMPTY before records are saved

- Flow tested: open `/attendance` → screen shows the roster (12 members, 5 حاضر / 7 راحة) computed from rotation → click طباعة كشف التمام (PDF) → the PDF prints **"لا توجد سجلات تمام لهذا اليوم"** with all counts = 0, even though the on-screen sheet shows the roster.
- Root cause: `DailyAttendancePdfView` (`backend/apps/reports/views.py`) renders only **saved** `DailyAttendance` records; the screen shows computed expected statuses until the officer clicks **حفظ واعتماد التمام**.
- After saving (verified via `POST /api/attendance/records/record-bulk/`), the same PDF renders correctly: إجمالي القوة 12 / حاضر 5 / راحة نوبة 7 — matches the screen.
- **Recommendation:** show a warning in the print dialog when the day is not yet saved/approved ("اليوم غير معتمد — سيتم طباعة كشف فارغ"), or auto-save before printing.

### A.3 Data/scope mismatch — viewer1 sees 0 members

- User `viewer1` (role scope `FAC-INF`, permission `member.view`) sees an empty members list.
- Cause: the seeded members belong to factions `alert-faction`, `guard-faction`, `patrol-faction`, while `viewer1` is scoped to `FAC-INF` — **no seed members exist for that faction**.
- Not a code bug, but a seed/configuration gap: the demo roles were never given matching data. Either scope viewer1 to a faction that has members or seed members for FAC-INF.

### A.4 Silent redirect on unauthorized route — no denial feedback

- `viewer1` navigating directly to `/settings` is silently redirected to `/members` with no message/dialog explaining the denial. Usability issue: users can't tell they lack permission vs. a broken link.

### A.5 ID cards have an API but no UI trigger

- `GET /api/members/id-cards/?ids=<id>` works and generates a clean 1-page PDF (verified: ملف 10232 جمال صالح رمضان الباروني, rank, faction, force number) — **but no button exists anywhere in the frontend** to generate ID cards. Officers cannot use this feature from the UI.

### A.6 Audit logging — API-driven actions lack user attribution in the list view

- Recent API actions (PDF prints, backup, bulk save triggered during automated flows) appear in `/api/audit/activity/` with `user: null`, while older UI actions show the user name. The CSV export shows the username correctly for the older entries. Verify the serializer/list view maps the actor correctly for all paths.

### A.7 Old PDFs (Aug 12) have overlapping/truncated Arabic text — ReportLab fallback

- `ملف_10232_جمال صالح رمضان الباروني*.pdf` files generated 2026-08-12 (in repo root and ~/Downloads) show overlapping glyphs and truncated labels (e.g. "الرقم الحر", "الرتتبة").
- All fresh WeasyPrint outputs (this session) extract cleanly with no duplicates or overlaps. The old files were produced by the ReportLab fallback path — if that fallback is ever hit in production, output is corrupted. Recommend removing the ReportLab fallback or fixing it.

### A.8 Download UX issues observed during testing

| Issue | Detail |
|-------|--------|
| Print buttons open PDF in a new tab | `printAuthedHtml` → `window.open(html=1&token=...)` — the URL contains the access token in the query string (token leakage into browser history/server logs). |
| Print dialog label mismatch | The daily attendance page button is "طباعة كشف التمام (PDF)" which prints directly; the downloadable PDF lives inside a dialog with a different label — two overlapping flows for the same report. |
| No print-preview dialog before official PDF | Official PDFs download immediately; there is no "preview before download" for the daily/monthly sheets. |

### A.9 Minor observations

- Dashboard numbers verified correct against DB: 8 vehicles (6 armed), 17 inventory items, 12 members.
- Pagination: 12 members, 10 per page — "عرض 1 إلى 10 من إجمالي 12 سجل" correct.
- Faction filter + Arabic search + service-status filter all work; grid/table toggle works.
- Member detail (4 tabs: نظرة عامة / المستندات / السجل الوظيفي / التعهدات) clean; member-file PDF renders 5 sections → 5 clean pages; all sections + birth certificate → 7 clean pages.
- `members.xlsx`: 1 sheet "الأعضاء", 13 rows × 9 cols (12 members), Arabic headers intact.
- Monthly CSV `تمام_شهري_2026_8.csv`: 13 rows × 40 cols (member info + 31 days + summaries), BOM included, "غير مسجل" for missing days — good.
- Audit CSV: 76 rows, correct headers; IP column exposed in CSV (operational consideration for sensitive environments).
- Backup pipeline: `POST /api/backups/run/` + download → `nsfa-backup-2026-08-20-3.sql.enc` (276 KB) → decrypts successfully (valid JSON dumpdata, hashed passwords, member data present).
- Earlier Aug 19 console log showed a one-time `500` on `/api/members/13/print/?sections=...&download=1` — **not reproducible** on Aug 20 (multiple successful prints). Likely a transient issue; monitor.

---

## Section B — Next Steps (recommendations for this class of military admin system)

### Immediate fixes (before production)
1. Add `useEffect` to imports in `ArmoryCategoriesPage.jsx` + `GeneralInventoryCategoriesPage.jsx` (A.1) — pages are completely unusable.
2. Decide the daily attendance print flow: warn when the day is unsaved (A.2).
3. Seed members for `FAC-INF` or fix viewer1's scope so the demo role sees data (A.3).
4. Add a denial message (toast/dialog) on unauthorized route access instead of a silent redirect (A.4).

### Short term
5. Add an "ID card" action (print/download) to the member detail page (A.5).
6. Fix audit log user attribution for API-driven actions (A.6).
7. Remove the ReportLab PDF fallback or fix its Arabic shaping (A.7).
8. Stop putting access tokens in print URLs — use server-side short-lived tokens or same-tab blob rendering (A.8).

### Long term (system class guidance)
9. **Audit & compliance:** log actor, IP, and payload hash for every PDF/CSV/backup download; add `Content-Disposition` verification and expiry for download links; consider masking IPs in exported CSV.
10. **Data integrity:** add a "print counter" per official document (each official sheet has a report number already — persist it), plus tamper-evident footer (hash) on official PDFs.
11. **Role model:** the permission matrix (view/record/manage per module) is solid — extend it to per-faction data scoping everywhere, not only members (attendance/vehicles/inventory lists are currently global for admins).
12. **Backup/DR:** the encrypted backup pipeline works — add scheduled backup cadence (the `ScheduledJobRun` guard exists), off-site storage, and a documented restore/merge test (restore to a staging DB was not tested) and add the images to is as well so when we backup, even the deleted member will be restored with his image as welll. (we can do that for other modules too like armory and inventory items, and vehicles) 
13. **Monitoring:** add structured logging + error tracking for the ErrorBoundary crashes; a crash like A.1 in production would be silent to operators.
14. **Testing:** the project has pytest tests (apps/attendance/tests/) — add coverage for the reports views (all PDF endpoints return 200 + valid PDF magic bytes) and the two settings pages (a smoke test would have caught A.1).
15. **Deployment checklist** (from global rules): production.py CORS allow-list, SECURE_PROXY_SSL_HEADER, DEBUG off, SMTP email backend, collectstatic before deploy, media served by nginx/S3; frontend `VITE_API_URL` via build arg; `manualChunks` in vite config; favicon/SEO meta; `.env.example` documenting all vars; HashRouter or nginx SPA fallback.

---

## Appendix — Verified Download Matrix (all artifacts scanned)

| Paper | Route/Trigger | Result | Artifact |
|-------|--------------|--------|----------|
| Member file PDF (default 5 sections) | member detail → طباعة الملف | 5 pages, clean | `ملف-10232-جمال-صالح-رمضان-الباروني.pdf` |
| Member file PDF (all sections + doc) | same dialog, all sections | 7 pages, clean | (re-verified via API) |
| Members Excel | /members → تصدير Excel | 13×9, Arabic OK | `members.xlsx` |
| Daily attendance PDF | /attendance → طباعة كشف التمام | 1 page; empty until saved, then 12 rows | `attendance-daily-2026-08-20.pdf` |
| Monthly attendance PDF | /attendance/monthly → تحميل PDF | 2 pages, matrix with day columns | `attendance-monthly-2026-08.pdf` |
| Monthly CSV | /attendance/monthly → تصدير Excel | 13×40, BOM, 31 days | `تمام-شهري-2026-8.csv` |
| Custody voucher PDF | inventory custody dialog | 1 page, VCH- number, recipient fields | `custody-voucher.pdf` |
| Vehicle trip ticket PDF | transportation trip dialog | 1 page, TRIP- number, plate/VIN | `trip-ticket-8.pdf` |
| Inventory stock summary PDF | /api/reports/inventory/summary/pdf/ | 2 pages, INV- number, categories | `inventory-summary.pdf` |
| ID cards PDF | API only (`/api/members/id-cards/?ids=13`) | 1 page, member/rank/force number | `id-cards.pdf` |
| Audit log CSV | /audit → تصدير | 76 rows, 8 cols | `audit-log.csv` |
| Encrypted DB backup | /backups → إنشاء + تحميل | 276 KB, decrypts OK | `backup-3.sql.enc` |

All artifacts preserved in `~/Downloads/NSFA-TEST/` and `.playwright-mcp/`.