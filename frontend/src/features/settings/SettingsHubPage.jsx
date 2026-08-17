import { useNavigate } from "react-router-dom";
import {
  Archive,
  Building2,
  ChevronLeft,
  Layers,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  UserCheck,
  Users,
  Car,
  Package,
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
      id: "organization",
      title: "الهيكل التنظيمي والتشكيلات",
      subtitle: "إدارة الإدارات، تصنيفات العتاد، الرتب، والتسلسل الإداري بالجهاز",
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
        {
          id: "equipment-categories",
          title: "تصنيفات العتاد والأسلحة",
          description: "إدارة وتعديل فئات وتصنيفات الأسلحة والذخائر والعتاد بالمستودع.",
          icon: Layers,
          to: "/settings/equipment-categories",
          badge: "مستودع",
          permission: "settings.manage",
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
      id: "modules",
      title: "المنظومات والأقسام التشغيلية",
      subtitle: "الوصول المباشر لإدارة السجلات، التمام، المستودعات، والأسطول",
      items: [
        {
          id: "members",
          title: "سجل شؤون الأفراد",
          description: "إدارة السجلات العسكرية والمدنية، بطاقات الهوية، والملفات الإدارية.",
          icon: Users,
          to: "/members",
          permission: "member.view",
          badge: "أفراد",
        },
        {
          id: "attendance",
          title: "التمام والانضباط اليومي",
          description: "كشوفات الحضور، التأخير، الانصراف المبكر، وحساب الإجازات التلقائي.",
          icon: CalendarCheck,
          to: "/attendance/daily",
          permission: "attendance.view",
          badge: "عمليات",
        },
        {
          id: "transportation",
          title: "قسم النقلية والآليات",
          description: "حصر ومتابعة أسطول المركبات، السائقين، التسليح الميداني، وأوامر التحرك.",
          icon: Car,
          to: "/transportation",
          permission: "transportation.view",
          badge: "آليات",
        },
        {
          id: "inventory",
          title: "المستودع والتسليح والعهد",
          description: "إدارة رصيد الذخائر، السلاح، المهمات، ومحاضر تسليم واستلام العهد.",
          icon: Package,
          to: "/inventory",
          permission: "equipment.view",
          badge: "إمداد",
        },
      ],
    },
    {
      id: "system",
      title: "النظام والضبط الأمني والنسخ الاحتياطي",
      subtitle: "إعدادات متطلبات الإدخال، سجل التدقيق والنسخ الاحتياطية",
      items: [
        {
          id: "field-requirements",
          title: "متطلبات الإدخال والحقول",
          description: "تحديد الحقول الإلزامية والاختيارية في نماذج إضافة الأفراد.",
          icon: Sliders,
          to: "/settings/field-requirements",
          permission: "settings.manage",
          badge: "نماذج",
        },
        {
          id: "audit",
          title: "سجل التدقيق والرقابة الأمني",
          description: "تتبع وحصر كافة الإجراءات والعمليات المنفذة على المنظومة الإدارية.",
          icon: ScrollText,
          to: "/audit",
          permission: "audit.view",
          badge: "تدقيق",
        },
        {
          id: "backups",
          title: "النسخ الاحتياطية وقواعد البيانات",
          description: "إجراء وتنزيل واسترجاع النسخ الاحتياطية المشفرة لقواعد البيانات.",
          icon: Archive,
          to: "/backups",
          permission: "backup.run",
          badge: "أمان",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <PageHeader
        title="مركز الإعدادات والضبط الإداري الشامل"
        description="لوحة التحكم المركزية لضبط الهيكل التنظيمي، الصلاحيات، الأقسام الإدارية، وسجلات الأمان."
      />

      <div className="space-y-8">
        {categories.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || hasPermission(item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id} className="space-y-3.5">
              <div>
                <h2 className="text-section font-bold text-slate-900 dark:text-white">{group.title}</h2>
                <p className="text-caption text-slate-500 dark:text-gray-400 font-medium">{group.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card
                      key={item.id}
                      onClick={() => navigate(item.to)}
                      className="group relative cursor-pointer rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] hover:border-[#2B95E8]/60 hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-6 flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-white/5 text-[#2B95E8] group-hover:bg-[#2B95E8] group-hover:text-white transition-colors">
                            <Icon className="h-6 w-6" />
                          </div>
                          {item.badge && (
                            <Badge variant="navy" className="text-caption font-semibold">
                              {item.badge}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-body font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                            <span>{item.title}</span>
                            <ChevronLeft className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </h3>
                          <p className="text-caption text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
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
