import {
  Archive,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Car,
  Clock,
  Crosshair,
  Layers,
  LayoutDashboard,
  PackageCheck,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

// Central nav registry with separate Armory, Inventory, and Transportation sections.
export const NAV_GROUPS = [
  {
    id: "general",
    title: "العامة وشؤون الأفراد",
    items: [
      { to: "/", label: "لوحة التحكم", icon: LayoutDashboard, end: true, breadcrumb: "لوحة التحكم" },
      { to: "/members", label: "سجل الأفراد", icon: Users, permission: "member.view", breadcrumb: "سجل الأفراد" },
      { to: "/members/new", label: "إضافة فرد جديد", icon: UserPlus, permission: "member.create", breadcrumb: "إضافة فرد جديد" },
    ],
  },
  {
    id: "attendance",
    title: "التمام والانضباط والورديات",
    items: [
      { to: "/attendance", label: "التمام اليومي", icon: CalendarCheck2, permission: "attendance.view", breadcrumb: "التمام اليومي" },
      { to: "/attendance/monthly", label: "التمام الشهري", icon: CalendarDays, permission: "attendance.view", breadcrumb: "التمام الشهري" },
      { to: "/attendance/rosters", label: "فصائل النوبات والورديات", icon: Clock, permission: "attendance.view", breadcrumb: "فصائل النوبات والورديات" },
    ],
  },
  {
    id: "armory",
    title: "قسم التسليح والأسلحة",
    items: [
      { to: "/armory", label: "سجل الأسلحة والذخائر", icon: Crosshair, permission: "equipment.view", breadcrumb: "سجل الأسلحة والذخائر" },
    ],
  },
  {
    id: "inventory",
    title: "المستودع والمخازن العامة",
    items: [
      { to: "/inventory", label: "المخازن والعتاد العام", icon: PackageCheck, permission: "equipment.view", breadcrumb: "المخازن والعتاد العام" },
    ],
  },
  {
    id: "transportation",
    title: "قسم النقلية والآليات",
    items: [
      { to: "/transportation", label: "سجل المركبات والآليات", icon: Car, permission: "transportation.view", breadcrumb: "سجل المركبات والآليات" },
    ],
  },
  {
    id: "structure",
    title: "الهيكل والتوزيع",
    items: [
      { to: "/organization/factions", label: "الإدارات والفصائل", icon: Building2, permission: "organization.manage", breadcrumb: "الإدارات والفصائل" },
      { to: "/organization/ranks", label: "الرتب العسكرية", icon: Shield, permission: "organization.manage", breadcrumb: "الرتب العسكرية" },
    ],
  },
  {
    id: "system",
    title: "الرقابة والنظام",
    items: [
      { to: "/audit", label: "سجل التدقيق", icon: ScrollText, permission: "audit.view", breadcrumb: "سجل التدقيق" },
      { to: "/backups", label: "النسخ الاحتياطية", icon: Archive, permission: "backup.run", breadcrumb: "النسخ الاحتياطية" },
      { to: "/settings", label: "إعدادات النظام", icon: Settings, permission: "settings.manage", breadcrumb: "إعدادات النظام" },
    ],
  },
];

// All route metadata for breadcrumbs and palette lookups
export const ALL_NAV_ITEMS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  { to: "/settings/field-requirements", label: "متطلبات الحقول", icon: Settings, permission: "settings.manage", breadcrumb: "متطلبات الحقول" },
  { to: "/settings/armory-categories", label: "تصنيفات وأنواع التسليح", icon: Crosshair, permission: "settings.manage", breadcrumb: "تصنيفات وأنواع التسليح" },
  { to: "/settings/inventory-categories", label: "تصنيفات المخازن والعتاد العام", icon: PackageCheck, permission: "settings.manage", breadcrumb: "تصنيفات المخازن والعتاد العام" },
  { to: "/settings/external-units", label: "الوحدات والجهات الخارجية", icon: Building2, permission: "settings.manage", breadcrumb: "الوحدات والجهات الخارجية" },
  { to: "/settings/equipment-categories", label: "تصنيفات العتاد القديمة", icon: Layers, breadcrumb: "تصنيفات العتاد" },
  { to: "/settings/roles", label: "الأدوار والصلاحيات", icon: Shield, permission: "roles.manage", breadcrumb: "الأدوار والصلاحيات" },
  { to: "/settings/users", label: "مستخدمو النظام", icon: UserCheck, permission: "users.manage", breadcrumb: "مستخدمو النظام" },
];

// Flat index for lookups by path (breadcrumbs, palette).
export const NAV_INDEX = Object.fromEntries(
  ALL_NAV_ITEMS.map((item) => [item.to, item])
);
