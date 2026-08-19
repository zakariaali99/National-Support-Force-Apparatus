import { useNavigate } from "react-router-dom";
import {
  Archive,
  Building2,
  ChevronLeft,
  Crosshair,
  Layers,
  Package,
  PackageCheck,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  UserCheck,
  Users,
  Car,
  CalendarCheck,
  FileCheck2,
} from "lucide-react";

import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../auth/AuthContext";

export function SettingsHubPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const categories = [
    {
      id: "armory_settings",
      title: "إعدادات قسم التسليح والأسلحة",
      subtitle: "إدارة وتخصيص تصنيفات الأسلحة الخفيفة، المتوسطة، الثقيلة، والذخائر",
      items: [
        {
          id: "armory-categories",
          title: "تصنيفات وأنواع التسليح",
          description: "تعريف وتعديل فئات وأنواع الأسلحة والذخائر والعيارات المعتمدة بالمنظومة.",
          icon: Crosshair,
          to: "/settings/armory-categories",
          badge: "تسليح",
          permission: "settings.manage",
        },
      ],
    },
    {
      id: "inventory_settings",
      title: "إعدادات المخازن والعتاد العام",
      subtitle: "إدارة فئات المهمات والملابس والمكاتب والتجهيزات الإدارية والميدانية",
      items: [
        {
          id: "inventory-categories",
          title: "تصنيفات المخازن والعتاد العام",
          description: "إدارة فئات الملابس، الأثاث، أجهزة الاتصال، المعدات الطبية، والقرطاسية.",
          icon: PackageCheck,
          to: "/settings/inventory-categories",
          badge: "مستودع",
          permission: "settings.manage",
        },
      ],
    },
    {
      id: "transportation_settings",
      title: "إعدادات قسم النقلية والآليات",
      subtitle: "إدارة وتوثيق الجهات والوحدات الخارجية لتبعية المركبات والأسطول",
      items: [
        {
          id: "external-units",
          title: "الوحدات والجهات الخارجية",
          description: "إدارة قائمة الأجهزة والكتائب والوحدات الخارجية التابعة لها المركبات أو المعارة إليها.",
          icon: Building2,
          to: "/settings/external-units",
          badge: "جهات خارجية",
          permission: "settings.manage",
        },
      ],
    },
    {
      id: "organization",
      title: "الهيكل التنظيمي والتشكيلات",
      subtitle: "إدارة الإدارات، القطاعات، الرتب، والتسلسل الإداري بالجهاز",
      items: [
        {
          id: "factions",
          title: "الإدارات والقطاعات",
          description: "إدارة الهيكل التنظيمي والإدارات والتشكيلات الإدارية التابعة للجهاز.",
          icon: Building2,
          to: "/organization/factions",
          badge: "هيكلي",
          permission: "organization.manage",
        },
        {
          id: "ranks",
          title: "الرتب العسكرية",
          description: "إدارة وتسلسل الرتب العسكرية والمستويات القيادية والأسبقية.",
          icon: Shield,
          to: "/organization/ranks",
          badge: "رتب",
          permission: "organization.manage",
        },
      ],
    },
    {
      id: "access",
      title: "إدارة الوصول والحسابات",
      subtitle: "التحكم في حسابات المستخدمين ومصفوفة الصلاحيات والأدوار",
      items: [
        {
          id: "users",
          title: "حسابات المستخدمين",
          description: "إدارة حسابات مستخدمي النظام وتعيين أدوارهم وفصائلهم المصرح بها.",
          icon: UserCheck,
          to: "/settings/users",
          permission: "users.manage",
          badge: "حسابات",
        },
        {
          id: "roles",
          title: "الأدوار ومصفوفة الصلاحيات",
          description: "تعريف مصفوفة الأدوار الوظيفية والصلاحيات التفصيلية ونطاقات الوصول.",
          icon: ShieldCheck,
          to: "/settings/roles",
          permission: "roles.manage",
          badge: "صلاحيات",
        },
      ],
    },
    {
      id: "system",
      title: "الأمان والرقابة والمطابقة",
      subtitle: "سجل التدقيق، النسخ الاحتياطي، وإعدادات التحقق من البيانات",
      items: [
        {
          id: "field-requirements",
          title: "إلزامية الحقول والبيانات",
          description: "تخصيص وإلزامية حقول نماذج الأفراد والبيانات حسب اللوائح الإدارية.",
          icon: FileCheck2,
          to: "/settings/field-requirements",
          permission: "settings.manage",
          badge: "إعدادات",
        },
        {
          id: "backups",
          title: "النسخ الاحتياطية",
          description: "إدارة النسخ الاحتياطي لقاعدة البيانات وتنزيلها واسترجاعها بأمان.",
          icon: Archive,
          to: "/backups",
          permission: "backup.run",
          badge: "أمان",
        },
        {
          id: "audit",
          title: "سجل تدقيق العمليات",
          description: "متابعة ورصد كافة العمليات الحساسة وتغييرات البيانات من قبل المستخدمين.",
          icon: ScrollText,
          to: "/audit",
          permission: "audit.view",
          badge: "رقابة",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="مركز إعدادات النظام"
        subtitle="التحكم الشامل في تصنيفات الأسلحة والمخازن، تبعية المركبات، الهيكل التنظيمي، الصلاحيات والأمان"
      />

      <div className="space-y-8">
        {categories.map((category) => {
          const visibleItems = category.items.filter(
            (item) => !item.permission || hasPermission(item.permission)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4">
              <div className="border-b border-slate-200/80 dark:border-white/10 pb-2 text-start">
                <h2 className="text-section font-bold text-slate-900 dark:text-white">
                  {category.title}
                </h2>
                <p className="text-caption text-slate-500 dark:text-gray-400 font-medium">
                  {category.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card
                      key={item.id}
                      onClick={() => navigate(item.to)}
                      className="group cursor-pointer border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-5 flex flex-col justify-between h-full space-y-4 text-start">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Icon className="w-5 h-5" />
                            </div>
                            {item.badge && (
                              <Badge variant="secondary" className="font-bold">
                                {item.badge}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-body font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-caption text-slate-500 dark:text-gray-400 leading-relaxed font-normal">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end text-caption font-bold text-blue-600 dark:text-blue-400 pt-2 border-t border-slate-100 dark:border-white/5">
                          <span className="flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
                            فتح الإعدادات
                            <ChevronLeft className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SettingsHubPage;
