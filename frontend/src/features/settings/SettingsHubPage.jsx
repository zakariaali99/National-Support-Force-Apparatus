import { useNavigate } from "react";
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
      title: "الهيكل التنظيمي والعتاد",
      subtitle: "إدارة الإدارات، تصنيفات العتاد، الرتب، والتسلسل الإداري",
      items: [
        {
          id: "factions",
          title: "الإدارات والقطاعات",
          description: "إدارة الهيكل التنظيمي والإدارات والتشكيلات الإدارية التابعة للجهاز.",
          icon: Building2,
          to: "/organization/factions",
          badge: "هيكلي",
        },
        {
          id: "ranks",
          title: "الرتب العسكرية",
          description: "إدارة وتسلسل الرتب العسكرية والمستويات القيادية.",
          icon: Shield,
          to: "/organization/ranks",
          badge: "رتب",
        },
        {
          id: "equipment-categories",
          title: "تصنيفات العتاد والأسلحة",
          description: "إدارة وتعديل فئات وتصنيفات الأسلحة والذخائر والعتاد بالجرد.",
          icon: Layers,
          to: "/settings/equipment-categories",
          badge: "جرد",
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
          description: "إدارة حسابات مستخدمي النظام وتعيين أدوارهم وإداراتهم المصرح بها.",
          icon: UserCheck,
          to: "/settings/users",
          permission: "users.manage",
          badge: "مستخدمين",
        },
        {
          id: "roles",
          title: "الأدوار والصلاحيات",
          description: "تعريف مصفوفة الأدوار والصلاحيات والنطاقات الإدارية.",
          icon: ShieldCheck,
          to: "/settings/roles",
          permission: "roles.manage",
          badge: "صلاحيات",
        },
      ],
    },
    {
      id: "system",
      title: "النظام والضبط الإداري",
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
          title: "سجل التدقيق والرقابة",
          description: "تتبع وحصر كافة الإجراءات والعمليات المنفذة على النظام.",
          icon: ScrollText,
          to: "/audit",
          permission: "audit.view",
          badge: "تدقيق",
        },
        {
          id: "backups",
          title: "النسخ الاحتياطية",
          description: "إجراء وتنزيل واسترجاع النسخ الاحتياطية المشفرة لقواعد البيانات.",
          icon: Archive,
          to: "/backups",
          permission: "backup.run",
          badge: "نسخ احتياطي",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="إعدادات النظام والضبط الإداري"
        description="مركز التحكم الشامل لضبط الهيكل التنظيمي، الصلاحيات، تصنيفات العتاد وسجلات الأمان."
      />

      <div className="space-y-8">
        {categories.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || hasPermission(item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id} className="space-y-3">
              <div>
                <h2 className="text-section font-extrabold text-foreground">{group.title}</h2>
                <p className="text-caption text-muted-foreground">{group.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card
                      key={item.id}
                      onClick={() => navigate(item.to)}
                      className="group relative cursor-pointer border border-border/80 hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Icon className="h-6 w-6" />
                          </div>
                          {item.badge && (
                            <Badge variant="secondary" className="font-bold">
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
