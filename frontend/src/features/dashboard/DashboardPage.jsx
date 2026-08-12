import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, ShieldAlert, Building2, UserPlus, ArrowLeft, ArrowUpRight, Calendar, FileText } from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { useMembers } from "../members/api";
import { factionsApi } from "../organization/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatCard } from "../../components/ui/StatCard";
import { formatDate } from "../../lib/format";
import { staggerIn } from "../../lib/motion";

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
  const { isLoading: isFactionsLoading } = factionsApi.useList();

  // 2. Fetch recent members
  const { data: recentData, isLoading: isRecentLoading } = useMembers({ page_size: 5, ordering: "-created_at" });
  const recentMembers = recentData?.results || [];

  const totalCount = totalData?.count ?? 0;
  const activeCount = activeData?.count ?? 0;
  const leaveCount = leaveData?.count ?? 0;

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
      tone: "primary",
      loading: isTotalLoading,
    },
    {
      title: "القوة العاملة بالخدمة",
      value: activeCount,
      icon: UserCheck,
      tone: "success",
      loading: isActiveLoading,
    },
    {
      title: "الأفراد في إجازة",
      value: leaveCount,
      icon: Calendar,
      tone: "warning",
      loading: isLeaveLoading,
    },
    {
      title: "معاملات بانتظار الاعتماد",
      value: pendingData?.count ?? 0,
      icon: ShieldAlert,
      tone: "danger",
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
              لوحة التحكم الرئيسية لإدارة السجلات، شؤون الأفراد، والهيكل التنظيمي بالجهاز الوطني للقوى المساندة.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/members/new">
              <Button size="sm" className="shadow-xs font-bold">
                <UserPlus className="me-1.5 h-4 w-4" />
                تسجيل فرد جديد
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
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Main Dashboard Layout split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Members widget */}
        <Card className="lg:col-span-2 border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-section font-bold">أحدث الأفراد المسجلين</CardTitle>
              <CardDescription className="text-caption">سجل ببيانات آخر الأفراد المضافين للمنظومة الإدارية</CardDescription>
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
                      <th className="py-2.5 text-start font-bold">الإدارة</th>
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
                <p className="font-bold text-label">إضافة فرد جديد</p>
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
                <p className="font-bold text-label">إدارة القطاعات والإدارات</p>
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
