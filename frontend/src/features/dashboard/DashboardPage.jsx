import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, ShieldAlert, Building2, UserPlus, ArrowLeft, ArrowUpRight, Calendar, FileText } from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { useMembers } from "../members/api";
import { factionsApi } from "../organization/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
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

  const currentDateArabic = new Intl.DateTimeFormat("ar-LY", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  // 1. Fetch KPI stats dynamically
  const { data: totalData, isLoading: isTotalLoading } = useMembers({ page_size: 1 });
  const { data: activeData, isLoading: isActiveLoading } = useMembers({ page_size: 1, service_status: "active" });
  const { data: leaveData, isLoading: isLeaveLoading } = useMembers({ page_size: 1, service_status: "on_leave" });
  const { data: pendingData, isLoading: isPendingLoading } = useMembers({ page_size: 1, approval_status: "pending" });
  const { data: factions = [], isLoading: isFactionsLoading } = factionsApi.useList();

  // 2. Fetch recent members
  const { data: recentData, isLoading: isRecentLoading } = useMembers({ page_size: 5, ordering: "-created_at" });
  const recentMembers = recentData?.results || [];

  const totalCount = totalData?.count ?? 0;
  const activeCount = activeData?.count ?? 0;
  const leaveCount = leaveData?.count ?? 0;

  const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
  const leavePercent = totalCount > 0 ? Math.round((leaveCount / totalCount) * 100) : 0;

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
      title: "إجمالي القوة المسجلة",
      value: totalCount,
      icon: Users,
      color: "text-primary bg-primary/10",
      loading: isTotalLoading,
    },
    {
      title: "القوة العاملة بالخدمة",
      value: activeCount,
      icon: UserCheck,
      color: "text-success bg-success/10",
      loading: isActiveLoading,
    },
    {
      title: "الأعضاء في إجازة",
      value: leaveCount,
      icon: Calendar,
      color: "text-warning bg-warning/10",
      loading: isLeaveLoading,
    },
    {
      title: "معاملات بانتظار الاعتماد",
      value: pendingData?.count ?? 0,
      icon: ShieldAlert,
      color: "text-danger bg-danger/10",
      loading: isPendingLoading,
      pulse: (pendingData?.count ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-caption font-semibold text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{currentDateArabic}</span>
            </div>
            <h1 className="text-title font-extrabold text-foreground tracking-tight">
              أهلاً بك، {displayName} 👋
            </h1>
            <p className="text-label text-muted-foreground max-w-2xl font-medium">
              لوحة التحكم الرئيسية لإدارة السجلات، شؤون الأعضاء، والهيكل التنظيمي بالجهاز الوطني للقوى المساندة.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/members/new">
              <Button size="sm" className="shadow-xs font-bold">
                <UserPlus className="me-1.5 h-4 w-4" />
                تسجيل عضو جديد
              </Button>
            </Link>
            <Link to="/members">
              <Button variant="outline" size="sm" className="font-bold">
                <FileText className="me-1.5 h-4 w-4" />
                السجل العام
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div ref={cardsRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="hover:shadow-xs transition-shadow duration-200 border-border/80">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-caption font-bold text-muted-foreground">{stat.title}</p>
                  {stat.loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-title font-extrabold tracking-tight text-foreground">
                        <AnimatedKpiValue value={stat.value} />
                      </h2>
                      {stat.pulse && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger"></span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Force Status Ratio Progress Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-section font-bold">توزيع حالة القوة البشرية</CardTitle>
            <span className="text-caption font-bold text-primary">
              مجموع الفصائل: {formatNumber(factions.length)} فصيلاً
            </span>
          </div>
          <CardDescription className="text-caption">
            نسبة توزيع الأعضاء بين الخدمة الفعالة والتعزيز والإجازات الرسمية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-3 w-full bg-secondary/60 rounded-full overflow-hidden flex dir-ltr">
            <div
              className="bg-success h-full transition-all duration-500"
              style={{ width: `${activePercent}%` }}
              title={`نشط: ${activePercent}%`}
            />
            <div
              className="bg-warning h-full transition-all duration-500"
              style={{ width: `${leavePercent}%` }}
              title={`إجازة: ${leavePercent}%`}
            />
            <div
              className="bg-danger/80 h-full transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - activePercent - leavePercent)}%` }}
              title="آخر"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-caption font-semibold pt-1">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success shrink-0" />
              <span>قوة بالخدمة: <strong className="text-foreground">{formatNumber(activeCount)}</strong> ({formatNumber(activePercent)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-warning shrink-0" />
              <span>في إجازة: <strong className="text-foreground">{formatNumber(leaveCount)}</strong> ({formatNumber(leavePercent)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-danger/80 shrink-0" />
              <span>إيقاف / آخر: <strong className="text-foreground">{formatNumber(Math.max(0, totalCount - activeCount - leaveCount))}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Layout split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Members widget */}
        <Card className="lg:col-span-2 border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-section font-bold">أحدث الأعضاء المسجلين</CardTitle>
              <CardDescription className="text-caption">سجل ببيانات آخر الأعضاء المضافين للمنظومة الإدارية</CardDescription>
            </div>
            <Link
              to="/members"
              className="text-caption font-bold text-primary hover:underline flex items-center gap-1 bg-secondary/60 hover:bg-secondary px-3 py-1.5 rounded-xl transition-colors"
            >
              <span>عرض السجل الكامل</span>
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-0 rotate-180" />
            </Link>
          </CardHeader>
          <CardContent>
            {isRecentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : recentMembers.length === 0 ? (
              <p className="text-center py-6 text-caption text-muted-foreground font-medium">لا يوجد أعضاء مسجلين بعد.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-caption">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border/80">
                      <th className="py-2.5 text-start font-bold">الاسم الكامل</th>
                      <th className="py-2.5 text-start font-bold">الرقم الحربي</th>
                      <th className="py-2.5 text-start font-bold">الفصيل / الإدارة</th>
                      <th className="py-2.5 text-start font-bold">تاريخ القيد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {recentMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-secondary/40 transition-colors group">
                        <td className="py-3 font-bold text-foreground">
                          <Link to={`/members/${member.id}`} className="hover:text-primary flex items-center gap-1.5">
                            <span>{member.full_name}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </Link>
                        </td>
                        <td className="py-3 text-muted-foreground font-mono font-bold" data-num>{member.force_number}</td>
                        <td className="py-3 text-muted-foreground font-medium">{member.faction_name || "—"}</td>
                        <td className="py-3 text-caption text-muted-foreground font-medium">{formatDate(member.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Administrative Quick Shortcuts Widget */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-section font-bold">روابط وإجراءات سريعة</CardTitle>
            <CardDescription className="text-caption">وصول سريع لمهام وأقسام الإدارة اليومية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link
              to="/members/new"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all text-foreground"
            >
              <div className="p-2.5 bg-success/15 text-success rounded-xl shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="text-start">
                <p className="font-bold text-label">إضافة عضو جديد</p>
                <p className="text-caption text-muted-foreground">إدخال سجل إداري جديد للقوة المساندة</p>
              </div>
            </Link>

            <Link
              to="/organization/factions"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all text-foreground"
            >
              <div className="p-2.5 bg-primary/15 text-primary rounded-xl shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="text-start">
                <p className="font-bold text-label">إدارة الفصائل والوحدات</p>
                <p className="text-caption text-muted-foreground">عرض وتوزيع الوحدات والإدارات التنظيمية</p>
              </div>
            </Link>

            <Link
              to="/audit"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all text-foreground"
            >
              <div className="p-2.5 bg-warning/15 text-warning rounded-xl shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="text-start">
                <p className="font-bold text-label">سجل التدقيق والأمان</p>
                <p className="text-caption text-muted-foreground">مراجعة العمليات والتعديلات المنفذة للنظام</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
