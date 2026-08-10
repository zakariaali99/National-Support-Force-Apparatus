import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./features/auth/LoginPage";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { MemberDetail } from "./features/members/MemberDetail";
import { MemberForm } from "./features/members/MemberForm";
import { MemberList } from "./features/members/MemberList";
import { FactionsPage } from "./features/organization/FactionsPage";
import { RanksPage } from "./features/organization/RanksPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/members" element={<MemberList />} />
          <Route path="/members/new" element={<MemberForm />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/members/:id/edit" element={<MemberForm />} />
          <Route path="/organization/ranks" element={<RanksPage />} />
          <Route path="/organization/factions" element={<FactionsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
