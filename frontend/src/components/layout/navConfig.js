import { Archive, Building2, ClipboardCheck, LayoutDashboard, ScrollText, Settings, Shield, UserCheck, Users } from "lucide-react";

// Central nav registry — later phases (Members, Settings, Audit, Backups,
// ...) add entries here rather than editing Sidebar.jsx directly.
// `permission`, when set, hides the item entirely for users lacking that
// codename (see useAuth().hasPermission); omit it for items every
// authenticated user should see regardless of role.
export const NAV_ITEMS = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard, end: true },
  { to: "/members", label: "الأعضاء", icon: Users },
  { to: "/members/approvals", label: "طلبات الاعتماد", icon: ClipboardCheck, permission: "member.approve" },
  { to: "/organization/ranks", label: "الرتب", icon: Shield },
  { to: "/organization/factions", label: "الفصائل", icon: Building2 },
  { to: "/settings/field-requirements", label: "متطلبات الحقول", icon: Settings, permission: "settings.manage" },
  { to: "/settings/roles", label: "الأدوار والصلاحيات", icon: Shield, permission: "roles.manage" },
  { to: "/settings/users", label: "مستخدمو النظام", icon: UserCheck, permission: "users.manage" },
  { to: "/audit", label: "سجل التدقيق", icon: ScrollText, permission: "audit.view" },
  { to: "/backups", label: "النسخ الاحتياطية", icon: Archive, permission: "backup.run" },
];

