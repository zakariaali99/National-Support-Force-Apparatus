import { Building2, LayoutDashboard, Shield, Users } from "lucide-react";

// Central nav registry — later phases (Members, Settings, Audit, Backups,
// ...) add entries here rather than editing Sidebar.jsx directly.
// `permission`, when set, hides the item entirely for users lacking that
// codename (see useAuth().hasPermission); omit it for items every
// authenticated user should see regardless of role.
export const NAV_ITEMS = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard, end: true },
  { to: "/members", label: "الأعضاء", icon: Users },
  { to: "/organization/ranks", label: "الرتب", icon: Shield },
  { to: "/organization/factions", label: "الفصائل", icon: Building2 },
];
