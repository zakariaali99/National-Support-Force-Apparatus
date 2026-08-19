import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./features/auth/LoginPage";
import { ProtectedRoute, PermissionRoute } from "./features/auth/ProtectedRoute";
import { PermissionDeniedDialog } from "./components/ui/PermissionDeniedDialog";

// Route-level code splitting
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage || m.default })));
const MemberDetail = lazy(() => import("./features/members/MemberDetail").then((m) => ({ default: m.MemberDetail || m.default })));
const MemberForm = lazy(() => import("./features/members/MemberForm").then((m) => ({ default: m.MemberForm || m.default })));
const MemberList = lazy(() => import("./features/members/MemberList").then((m) => ({ default: m.MemberList || m.default })));
const FactionsPage = lazy(() => import("./features/organization/FactionsPage").then((m) => ({ default: m.FactionsPage || m.default })));
const RanksPage = lazy(() => import("./features/organization/RanksPage").then((m) => ({ default: m.RanksPage || m.default })));
const FieldRequirementsPage = lazy(() => import("./features/settings/FieldRequirementsPage").then((m) => ({ default: m.FieldRequirementsPage || m.default })));
const EquipmentCategoriesPage = lazy(() => import("./features/settings/EquipmentCategoriesPage").then((m) => ({ default: m.EquipmentCategoriesPage || m.default })));
const ArmoryCategoriesPage = lazy(() => import("./features/settings/ArmoryCategoriesPage").then((m) => ({ default: m.ArmoryCategoriesPage || m.default })));
const GeneralInventoryCategoriesPage = lazy(() => import("./features/settings/GeneralInventoryCategoriesPage").then((m) => ({ default: m.GeneralInventoryCategoriesPage || m.default })));
const ExternalUnitsPage = lazy(() => import("./features/settings/ExternalUnitsPage").then((m) => ({ default: m.ExternalUnitsPage || m.default })));
const SettingsHubPage = lazy(() => import("./features/settings/SettingsHubPage").then((m) => ({ default: m.SettingsHubPage || m.default })));
const RolesPage = lazy(() => import("./features/settings/RolesPage").then((m) => ({ default: m.RolesPage || m.default })));
const UsersPage = lazy(() => import("./features/settings/UsersPage").then((m) => ({ default: m.UsersPage || m.default })));
const AuditPage = lazy(() => import("./features/audit/AuditPage").then((m) => ({ default: m.AuditPage || m.default })));
const BackupsPage = lazy(() => import("./features/backups/BackupsPage").then((m) => ({ default: m.BackupsPage || m.default })));
const ArmoryPage = lazy(() => import("./features/armory/ArmoryPage").then((m) => ({ default: m.ArmoryPage || m.default })));
const InventoryPage = lazy(() => import("./features/inventory/InventoryPage").then((m) => ({ default: m.InventoryPage || m.default })));
const VehiclesPage = lazy(() => import("./features/transportation/VehiclesPage").then((m) => ({ default: m.VehiclesPage || m.default })));
const DailyAttendancePage = lazy(() => import("./features/attendance/DailyAttendancePage").then((m) => ({ default: m.DailyAttendancePage || m.default })));
const MonthlyAttendancePage = lazy(() => import("./features/attendance/MonthlyAttendancePage").then((m) => ({ default: m.MonthlyAttendancePage || m.default })));
const ShiftRostersPage = lazy(() => import("./features/attendance/ShiftRostersPage").then((m) => ({ default: m.ShiftRostersPage || m.default })));

function RouteFallback() {
  return <div className="p-8 text-center text-caption text-muted-foreground">جارِ التحميل...</div>;
}

export default function App() {
  return (
    <>
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
              <PermissionRoute permission="member.view">
                <Suspense fallback={<RouteFallback />}>
                  <MemberList />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/members/new"
            element={
              <PermissionRoute permission="member.create">
                <Suspense fallback={<RouteFallback />}>
                  <MemberForm />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/members/:id"
            element={
              <PermissionRoute permission="member.view">
                <Suspense fallback={<RouteFallback />}>
                  <MemberDetail />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/members/:id/edit"
            element={
              <PermissionRoute permission="member.edit">
                <Suspense fallback={<RouteFallback />}>
                  <MemberForm />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <PermissionRoute permission="attendance.view">
                <Suspense fallback={<RouteFallback />}>
                  <DailyAttendancePage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/attendance/daily"
            element={
              <PermissionRoute permission="attendance.view">
                <Suspense fallback={<RouteFallback />}>
                  <DailyAttendancePage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/attendance/monthly"
            element={
              <PermissionRoute permission="attendance.view">
                <Suspense fallback={<RouteFallback />}>
                  <MonthlyAttendancePage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/attendance/rosters"
            element={
              <PermissionRoute permission="attendance.view">
                <Suspense fallback={<RouteFallback />}>
                  <ShiftRostersPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/transportation"
            element={
              <PermissionRoute permission="transportation.view">
                <Suspense fallback={<RouteFallback />}>
                  <VehiclesPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/armory"
            element={
              <PermissionRoute permission="equipment.view">
                <Suspense fallback={<RouteFallback />}>
                  <ArmoryPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PermissionRoute permission="equipment.view">
                <Suspense fallback={<RouteFallback />}>
                  <InventoryPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/organization/ranks"
            element={
              <PermissionRoute permission="organization.manage">
                <Suspense fallback={<RouteFallback />}>
                  <RanksPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/organization/factions"
            element={
              <PermissionRoute permission="organization.manage">
                <Suspense fallback={<RouteFallback />}>
                  <FactionsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PermissionRoute permission="settings.manage">
                <Suspense fallback={<RouteFallback />}>
                  <SettingsHubPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/settings/armory-categories"
            element={
              <PermissionRoute permission="settings.manage">
                <Suspense fallback={<RouteFallback />}>
                  <ArmoryCategoriesPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/settings/inventory-categories"
            element={
              <PermissionRoute permission="settings.manage">
                <Suspense fallback={<RouteFallback />}>
                  <GeneralInventoryCategoriesPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/settings/external-units"
            element={
              <PermissionRoute permission="settings.manage">
                <Suspense fallback={<RouteFallback />}>
                  <ExternalUnitsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/settings/field-requirements"
            element={
              <PermissionRoute permission="settings.manage">
                <Suspense fallback={<RouteFallback />}>
                  <FieldRequirementsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/settings/equipment-categories"
            element={
              <PermissionRoute permission="settings.manage">
                <Suspense fallback={<RouteFallback />}>
                  <EquipmentCategoriesPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/settings/roles"
            element={
              <PermissionRoute permission="roles.manage">
                <Suspense fallback={<RouteFallback />}>
                  <RolesPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/settings/users"
            element={
              <PermissionRoute permission="users.manage">
                <Suspense fallback={<RouteFallback />}>
                  <UsersPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <PermissionRoute permission="audit.view">
                <Suspense fallback={<RouteFallback />}>
                  <AuditPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="/backups"
            element={
              <PermissionRoute permission="backup.run">
                <Suspense fallback={<RouteFallback />}>
                  <BackupsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <PermissionDeniedDialog />
    </>
  );
}
