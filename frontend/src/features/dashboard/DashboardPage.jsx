import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, ShieldAlert, Building2, UserPlus, Rss, ArrowLeft, ArrowUpRight } from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { useMembers } from "../members/api";
import { factionsApi } from "../organization/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDate, formatNumber } from "../../lib/format";
import { countUp, staggerIn } from "../../lib/motion";

function AnimatedKpiValue({ value }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const tween = countUp(value, setDisplayVal);
    return () => {
      if (tween) tween.kill();
    };
  }, [value]);

  return <>{formatNumber(displayVal)}</>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username;
  const cardsRef = useRef(null);

  // 1. Fetch KPI stats dynamically
  const { data: totalData, isLoading: isTotalLoading } = useMembers({ page_size: 1 });
  const { data: activeData, isLoading: isActiveLoading } = useMembers({ page_size: 1, service_status: "active" });
  const { data: pendingData, isLoading: isPendingLoading } = useMembers({ page_size: 1, approval_status: "pending" });
  const { data: factions = [], isLoading: isFactionsLoading } = factionsApi.useList();

  // 2. Fetch recent members
  const { data: recentData, isLoading: isRecentLoading } = useMembers({ page_size: 5, ordering: "-created_at" });
  const recentMembers = recentData?.results || [];

  const isAnyLoading = isTotalLoading || isActiveLoading || isPendingLoading || isFactionsLoading;

  useEffect(() => {
    if (!isAnyLoading && cardsRef.current) {
      const tween = staggerIn(cardsRef.current.children, { y: 15, duration: 0.3 });
      return () => {
        if (tween) tween.kill();
      };
    }
  }, [isAnyLoading]);

  const stats = [
    {
      title: "إجمالي القوة (الأعضاء)",
      value: totalData?.count ?? 0,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
      loading: isTotalLoading,
    },
    {
      title: "الأعضاء النشطون",
      value: activeData?.count ?? 0,
      icon: UserCheck,
      color: "text-success bg-success/10",
      loading: isActiveLoading,
    },
    {
      title: "بانتظار الاعتماد",
      value: pendingData?.count ?? 0,
      icon: ShieldAlert,
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      loading: isPendingLoading,
      pulse: (pendingData?.count ?? 0) > 0,
    },
    {
      title: "الفصائل (الإدارات)",
      value: factions.length,
      icon: Building2,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
      loading: isFactionsLoading,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-sm relative overflow-hidden bg-gradient-to-r from-secondary/30 via-transparent to-transparent">
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            مرحباً بك، {displayName}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-medium leading-relaxed">
            نظام إدارة شؤون وأعضاء الجهاز الوطني للقوى المساندة. تابع الإحصائيات العامة للقوة والنشاطات الأخيرة من خلال لوحة التحكم.
          </p>
        </div>
        <div className="absolute top-0 end-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
      </div>

      {/* KPI Stats Grid */}
      <div ref={cardsRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">{stat.title}</p>
                  {stat.loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                        <AnimatedKpiValue value={stat.value} />
                      </h2>
                      {stat.pulse && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={`p-3.5 rounded-xl shrink-0 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Dashboard Layout split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Members widget */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>أحدث الأعضاء المضافين</CardTitle>
              <CardDescription>آخر 5 أعضاء تم تسجيلهم في القوة الوطنية.</CardDescription>
            </div>
            <Link
              to="/members"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-secondary/60 hover:bg-secondary px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="h-3 w-3 rtl:rotate-0 rotate-180" />
            </Link>
          </CardHeader>
          <CardContent>
            {isRecentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-12 w-full" />
                ))}
              </div>
            ) : recentMembers.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">لا يوجد أعضاء مسجلين بعد.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="py-2.5 text-start font-medium">الاسم الكامل</th>
                      <th className="py-2.5 text-start font-medium">الرقم الحربي</th>
                      <th className="py-2.5 text-start font-medium">الفصيل</th>
                      <th className="py-2.5 text-start font-medium">تاريخ الإضافة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-secondary/40 group">
                        <td className="py-3 font-semibold text-foreground">
                          <Link to={`/members/${member.id}`} className="hover:text-primary flex items-center gap-1.5">
                            <span>{member.full_name}</span>
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </Link>
                        </td>
                        <td className="py-3 text-muted-foreground font-mono">{member.force_number}</td>
                        <td className="py-3 text-muted-foreground">{member.faction_name}</td>
                        <td className="py-3 text-xs text-muted-foreground">{formatDate(member.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shortcuts Widget */}
        <Card>
          <CardHeader>
            <CardTitle>روابط سريعة</CardTitle>
            <CardDescription>الوصول المباشر لوظائف النظام الأساسية.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link
              to="/members/new"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-secondary/50 hover:shadow-sm hover:border-primary/20 transition-all font-semibold text-sm text-foreground"
            >
              <div className="p-2 bg-success/15 text-success rounded-lg">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="text-start">
                <p className="font-bold text-xs">إضافة عضو جديد</p>
                <p className="text-[10px] text-muted-foreground">تسجيل بيانات وصور عضو جديد بالقوة</p>
              </div>
            </Link>

            <Link
              to="/organization/ranks"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-secondary/50 hover:shadow-sm hover:border-primary/20 transition-all font-semibold text-sm text-foreground"
            >
              <div className="p-2 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Rss className="h-5 w-5" />
              </div>
              <div className="text-start">
                <p className="font-bold text-xs">إدارة الرتب العسكرية</p>
                <p className="text-[10px] text-muted-foreground">إضافة أو تعديل رتب وهيكل القوة</p>
              </div>
            </Link>

            <Link
              to="/settings/field-requirements"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-secondary/50 hover:shadow-sm hover:border-primary/20 transition-all font-semibold text-sm text-foreground"
            >
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="text-start">
                <p className="font-bold text-xs">شروط الاستمارة</p>
                <p className="text-[10px] text-muted-foreground">تحديد الحقول الإجبارية والاختيارية بالنموذج</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
