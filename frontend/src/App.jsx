import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./features/auth/LoginPage";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";

// Route-level code splitting — each feature area becomes its own chunk,
// fetched on first navigation instead of all landing in the single
// >500KB bundle flagged since Phase 1 (see NEXT.md). LoginPage/AppShell/
// ProtectedRoute stay eager: they're needed before any route decision.
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage || m.default })));
const MemberDetail = lazy(() => import("./features/members/MemberDetail").then((m) => ({ default: m.MemberDetail || m.default })));
const MemberForm = lazy(() => import("./features/members/MemberForm").then((m) => ({ default: m.MemberForm || m.default })));
const MemberList = lazy(() => import("./features/members/MemberList").then((m) => ({ default: m.MemberList || m.default })));
const FactionsPage = lazy(() => import("./features/organization/FactionsPage").then((m) => ({ default: m.FactionsPage || m.default })));
const RanksPage = lazy(() => import("./features/organization/RanksPage").then((m) => ({ default: m.RanksPage || m.default })));
const FieldRequirementsPage = lazy(() => import("./features/settings/FieldRequirementsPage").then((m) => ({ default: m.FieldRequirementsPage || m.default })));
const EquipmentCategoriesPage = lazy(() => import("./features/settings/EquipmentCategoriesPage").then((m) => ({ default: m.EquipmentCategoriesPage || m.default })));
const SettingsHubPage = lazy(() => import("./features/settings/SettingsHubPage").then((m) => ({ default: m.SettingsHubPage || m.default })));
const RolesPage = lazy(() => import("./features/settings/RolesPage").then((m) => ({ default: m.RolesPage || m.default })));
const UsersPage = lazy(() => import("./features/settings/UsersPage").then((m) => ({ default: m.UsersPage || m.default })));
const AuditPage = lazy(() => import("./features/audit/AuditPage").then((m) => ({ default: m.AuditPage || m.default })));
const BackupsPage = lazy(() => import("./features/backups/BackupsPage").then((m) => ({ default: m.BackupsPage || m.default })));
const InventoryPage = lazy(() => import("./features/inventory/InventoryPage").then((m) => ({ default: m.InventoryPage || m.default })));
const VehiclesPage = lazy(() => import("./features/transportation/VehiclesPage").then((m) => ({ default: m.VehiclesPage || m.default })));
const DailyAttendancePage = lazy(() => import("./features/attendance/DailyAttendancePage").then((m) => ({ default: m.DailyAttendancePage || m.default })));
const MonthlyAttendancePage = lazy(() => import("./features/attendance/MonthlyAttendancePage").then((m) => ({ default: m.MonthlyAttendancePage || m.default })));
const ShiftRostersPage = lazy(() => import("./features/attendance/ShiftRostersPage").then((m) => ({ default: m.ShiftRostersPage || m.default })));

function RouteFallback() {
  return <div className="p-8 text-center text-sm text-muted-foreground">جارِ التحميل...</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<RouteFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/members"
            element={
              <Suspense fallback={<RouteFallback />}>
                <MemberList />
              </Suspense>
            }
          />
          <Route
            path="/members/new"
            element={
              <Suspense fallback={<RouteFallback />}>
                <MemberForm />
              </Suspense>
            }
          />
          <Route
            path="/members/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <MemberDetail />
              </Suspense>
            }
          />
          <Route
            path="/members/:id/edit"
            element={
              <Suspense fallback={<RouteFallback />}>
                <MemberForm />
              </Suspense>
            }
          />
          <Route
            path="/attendance"
            element={
              <Suspense fallback={<RouteFallback />}>
                <DailyAttendancePage />
              </Suspense>
            }
          />
          <Route
            path="/attendance/monthly"
            element={
              <Suspense fallback={<RouteFallback />}>
                <MonthlyAttendancePage />
              </Suspense>
            }
          />
          <Route
            path="/attendance/rosters"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ShiftRostersPage />
              </Suspense>
            }
          />
          <Route
            path="/transportation"
            element={
              <Suspense fallback={<RouteFallback />}>
                <VehiclesPage />
              </Suspense>
            }
          />
          <Route
            path="/organization/ranks"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RanksPage />
              </Suspense>
            }
          />
          <Route
            path="/organization/factions"
            element={
              <Suspense fallback={<RouteFallback />}>
                <FactionsPage />
              </Suspense>
            }
          />
          <Route
            path="/inventory"
            element={
              <Suspense fallback={<RouteFallback />}>
                <InventoryPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<RouteFallback />}>
                <SettingsHubPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/field-requirements"
            element={
              <Suspense fallback={<RouteFallback />}>
                <FieldRequirementsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/equipment-categories"
            element={
              <Suspense fallback={<RouteFallback />}>
                <EquipmentCategoriesPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/roles"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RolesPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/users"
            element={
              <Suspense fallback={<RouteFallback />}>
                <UsersPage />
              </Suspense>
            }
          />
          <Route
            path="/audit"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AuditPage />
              </Suspense>
            }
          />
          <Route
            path="/backups"
            element={
              <Suspense fallback={<RouteFallback />}>
                <BackupsPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
