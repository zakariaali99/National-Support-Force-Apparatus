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
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

// Clean, streamlined navigation structure with clear separation between Armory, Inventory, and Transportation
export const NAV_GROUPS = [
  {
    id: "personnel",
    title: "شؤون الأفراد والتمام",
    items: [
      { to: "/", label: "لوحة التحكم", icon: LayoutDashboard, end: true, breadcrumb: "لوحة التحكم" },
      { to: "/members", label: "سجل الأفراد", icon: Users, permission: "member.view", breadcrumb: "سجل الأفراد" },
      { to: "/attendance", label: "التمام اليومي والانضباط", icon: CalendarCheck2, permission: "attendance.view", breadcrumb: "التمام اليومي" },
      { to: "/attendance/monthly", label: "التمام الشهري", icon: CalendarDays, permission: "attendance.view", breadcrumb: "التمام الشهري" },
      { to: "/attendance/rosters", label: "فصائل النوبات والورديات", icon: Clock, permission: "attendance.view", breadcrumb: "فصائل النوبات والورديات" },
    ],
  },
  {
    id: "logistics",
    title: "العهد والمستودعات",
    items: [
      { to: "/armory", label: "قسم التسليح والأسلحة", icon: Crosshair, permission: "equipment.view", breadcrumb: "قسم التسليح والأسلحة" },
      { to: "/inventory", label: "المستودع والمخازن العامة", icon: PackageCheck, permission: "equipment.view", breadcrumb: "المستودع والمخازن العامة" },
      { to: "/transportation", label: "قسم النقلية والآليات", icon: Car, permission: "transportation.view", breadcrumb: "قسم النقلية والآليات" },
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
    title: "الإدارة والنظام",
    items: [
      { to: "/audit", label: "سجل التدقيق والأنشطة", icon: ScrollText, permission: "audit.view", breadcrumb: "سجل التدقيق" },
      { to: "/backups", label: "النسخ الاحتياطية", icon: Archive, permission: "backup.run", breadcrumb: "النسخ الاحتياطية" },
      { to: "/settings", label: "إعدادات المنظومة", icon: Settings, permission: "settings.manage", breadcrumb: "إعدادات النظام" },
    ],
  },
];

// All route metadata for breadcrumbs and palette lookups
export const ALL_NAV_ITEMS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  { to: "/members/new", label: "إضافة فرد جديد", icon: UserPlus, permission: "member.create", breadcrumb: "إضافة فرد جديد" },
  { to: "/attendance/monthly", label: "التمام الشهري", icon: CalendarDays, permission: "attendance.view", breadcrumb: "التمام الشهري" },
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
