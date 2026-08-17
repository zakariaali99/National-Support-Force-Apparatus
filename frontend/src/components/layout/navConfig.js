import {
  Archive,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Car,
  Clock,
  LayoutDashboard,
  PackageCheck,
  ScrollText,
  Settings,
  Shield,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

// Central nav registry.
export const NAV_GROUPS = [
  {
    id: "general",
    title: "العامة وشؤون الأفراد",
    items: [
      { to: "/", label: "لوحة التحكم", icon: LayoutDashboard, end: true, breadcrumb: "لوحة التحكم" },
      { to: "/members", label: "سجل الأفراد", icon: Users, breadcrumb: "سجل الأفراد" },
      { to: "/members/new", label: "إضافة فرد جديد", icon: UserPlus, permission: "member.create", breadcrumb: "إضافة فرد جديد" },
    ],
  },
  {
    id: "attendance",
    title: "التمام والانضباط والورديات",
    items: [
      { to: "/attendance", label: "التمام اليومي", icon: CalendarCheck2, breadcrumb: "التمام اليومي" },
      { to: "/attendance/monthly", label: "التمام الشهري", icon: CalendarDays, breadcrumb: "التمام الشهري" },
      { to: "/attendance/rosters", label: "فصائل النوبات والورديات", icon: Clock, breadcrumb: "فصائل النوبات والورديات" },
    ],
  },
  {
    id: "logistics",
    title: "النقلية والإمداد والتسليح",
    items: [
      { to: "/transportation", label: "قسم النقلية والمركبات", icon: Car, breadcrumb: "قسم النقلية والمركبات" },
      { to: "/inventory", label: "المستودع والمخزن والعهد", icon: PackageCheck, breadcrumb: "المستودع والمخزن والعهد" },
    ],
  },
  {
    id: "structure",
    title: "الهيكل والتوزيع",
    items: [
      { to: "/organization/factions", label: "الإدارات والفصائل", icon: Building2, breadcrumb: "الإدارات والفصائل" },
      { to: "/organization/ranks", label: "الرتب العسكرية", icon: Shield, breadcrumb: "الرتب العسكرية" },
    ],
  },
  {
    id: "system",
    title: "الرقابة والنظام",
    items: [
      { to: "/audit", label: "سجل التدقيق", icon: ScrollText, permission: "audit.view", breadcrumb: "سجل التدقيق" },
      { to: "/backups", label: "النسخ الاحتياطية", icon: Archive, permission: "backup.run", breadcrumb: "النسخ الاحتياطية" },
      { to: "/settings", label: "إعدادات النظام", icon: Settings, breadcrumb: "إعدادات النظام" },
    ],
  },
];

// All route metadata for breadcrumbs and palette lookups
export const ALL_NAV_ITEMS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  { to: "/settings/field-requirements", label: "متطلبات الحقول", icon: Settings, permission: "settings.manage", breadcrumb: "متطلبات الحقول" },
  { to: "/settings/equipment-categories", label: "تصنيفات العتاد والأسلحة", icon: Settings, breadcrumb: "تصنيفات العتاد والأسلحة" },
  { to: "/settings/roles", label: "الأدوار والصلاحيات", icon: Shield, permission: "roles.manage", breadcrumb: "الأدوار والصلاحيات" },
  { to: "/settings/users", label: "مستخدمو النظام", icon: UserCheck, permission: "users.manage", breadcrumb: "مستخدمو النظام" },
];

// Flat index for lookups by path (breadcrumbs, palette).
export const NAV_INDEX = Object.fromEntries(
  ALL_NAV_ITEMS.map((item) => [item.to, item])
);
