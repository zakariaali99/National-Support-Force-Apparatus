# Administrative HR System UI/UX Master Plan

> **RETIRED** — superseded by `plans/ui-rebuild-finish-plan.md`. Retained for reference.

This plan details a multi-phase upgrade to transform the National Support Force Apparatus into a state-of-the-art, high-efficiency **Administrative HR Management & Data-Entry Portal**.

---

## 🎨 1. System Identity & Design System

- **Target App Identity**: Modern Enterprise HR & Administrative Management Apparatus.
- **Primary Color Palette**: Crisp Light Mode (`#ffffff` card background, `#f8fafc` subtle slate page background, `#0a2540` deep navy text, `#2563eb` primary royal blue, `#d4af37` metallic gold highlights).
- **Typography**: Arabic-first Cairo font scale (`text-display`, `text-title`, `text-section`, `text-body`, `text-body-sm`, `text-label`, `text-caption`) with weights 400, 600, 700.
- **RTL & Tabular Numerals**: Right-aligned Arabic text; isolated LTR tabular digits (`direction: ltr`, `font-mono`) for force numbers and national IDs.

---

## 🎯 2. Phase-by-Phase Execution Plan

### Phase 1 — Design System Tokens & Component Primitives
- **`index.css`**: Configure default light mode CSS variables, soft shadows (`shadow-xs`, `shadow-sm`), subtle borders (`border-border/80`), and custom scrollbars.
- **UI Components**:
  - `Card.jsx`: Crisp white background, `rounded-2xl border border-border/80 shadow-xs`.
  - `Button.jsx`: Elevated active press scale (`active:scale-[0.98] transition-transform rounded-xl font-bold`).
  - `Badge.jsx`: Soft chip fills (Active = Emerald, On Leave = Amber, Suspended = Crimson).
  - `DataTable.jsx`: High data-density layout with sticky headers and responsive scrolling.

### Phase 2 — Administrative Dashboard Overhaul (`DashboardPage.jsx`)
- **Top Greeting Header**: Welcome message with date, user role, and quick action shortcuts.
- **4 Administrative Metric Cards**:
  - Total Registered Force (إجمالي القوة).
  - Active Service Force (القوة العاملة بالخدمة).
  - Personnel On Leave (الأعضاء في إجازة).
  - Pending Tasks & Requests (المهام والطلبات المعلقة).
- **Force Ratios Visual Bar**: Percentage bar displaying Active vs. On Leave vs. Suspended ratios.
- **Recent Activity & Tasks Widget**: Dual-column widget showing recent audit actions and administrative task items.

### Phase 3 — High-Density Member Register & Row Actions (`MemberList.jsx`)
- **Filter Controls**: Instant search input (Name, Force Number, National ID), Faction Combobox, Rank Combobox, Service Status selector.
- **High Data-Density Table**: Aligned Arabic columns + isolated LTR tabular digits.
- **1-Click Inline Procedures Rail**: Dedicated row buttons (`تعديل`, `ملاحظة`, `مهمة`, `تقييم`, `طباعة`).
- **Universal Pagination Integration**: Connect `Pagination.jsx` with page numbers, `السابق`/`التالي` buttons, item counts, and items-per-page picker.

### Phase 4 — Member Profile & Dossier Tabs (`MemberDetail.jsx` & `ProfileExtras.jsx`)
- **Hero Dossier Card**: Member photo, full name, force number, rank badge, faction badge, and quick print button.
- **Organized Tabbed Sections**:
  - 📋 **البيانات الشخصية والإدارية** (Personal & Administrative Details).
  - 📝 **الملاحظات الإدارية** (Administrative Notes with modal addition).
  - 📌 **المهام والتكاليف** (Assigned Tasks with checkboxes).
  - ⭐ **التقييمات والتقارير** (Performance Evaluations & Ratings).
  - 🌴 **سجل الإجازات** (Vacation Ledger & Balance Transactions).

### Phase 5 — Organization Management (`RanksPage.jsx` & `FactionsPage.jsx`)
- **Zero Technical English Slug Fields**: Forms request only Arabic titles and descriptions; internal code keys are auto-generated under the hood.
- **Executive Data Tables**: Clean listing with order inputs, descriptions, and active switches.

### Phase 6 — System Governance (`UsersPage.jsx`, `RolesPage.jsx`, `AuditPage.jsx`)
- **RolesPage**: Form for Arabic role titles, scope selection (`all`, `own_faction`, `own_records`), and permission checkboxes without English code input.
- **UsersPage**: Clean user creation & editing form with role checkboxes and pagination.
- **AuditPage**: Filterable activity log table with pagination and formatted timestamps.

---

## 🛠️ Proposed File Modifications

- **[MODIFY]** [index.css](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/index.css) (Default enterprise light mode tokens)
- **[MODIFY]** [DashboardPage.jsx](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/features/dashboard/DashboardPage.jsx) (Executive administrative dashboard widgets)
- **[MODIFY]** [MemberList.jsx](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/features/members/MemberList.jsx) (High-density table, 1-click inline actions, pagination)
- **[MODIFY]** [MemberDetail.jsx](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/features/members/MemberDetail.jsx) (Dossier hero header & tabbed sections)
- **[MODIFY]** [ProfileExtras.jsx](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/features/members/ProfileExtras.jsx) (Clean tabs for notes, tasks, evals, vacations)
- **[MODIFY]** [RanksPage.jsx](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/features/organization/RanksPage.jsx) (Clean Arabic forms, auto-generated keys)
- **[MODIFY]** [FactionsPage.jsx](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/features/organization/FactionsPage.jsx) (Clean Arabic forms, auto-generated keys)
- **[MODIFY]** [RolesPage.jsx](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/features/settings/RolesPage.jsx) (Clean Arabic role forms, auto-generated keys, pagination)
- **[MODIFY]** [UsersPage.jsx](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/features/settings/UsersPage.jsx) (Administrative user forms, pagination)
- **[MODIFY]** [AuditPage.jsx](file:///Users/zakaria/projects/antigravity/National%20Support%20Force%20Apparatus/frontend/src/features/audit/AuditPage.jsx) (Filterable audit logs with pagination)

---

## 🧪 Verification Plan

### Automated Checks
- `npm run lint && npm run build` to verify 0 frontend compilation errors & 46 contrast pair validations.
- `python manage.py test` to verify all 141 backend integration tests pass cleanly.

### Manual Verification
- Test administrative dashboard KPIs and status distribution bar.
- Test Member List inline procedure buttons (`تعديل`, `ملاحظة`, `مهمة`, `تقييم`, `طباعة`).
- Verify forms create ranks, factions, and roles without asking for English slugs.
- Verify pagination across all list screens.
