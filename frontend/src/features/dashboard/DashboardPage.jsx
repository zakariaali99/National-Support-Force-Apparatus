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
import { AttendanceTrendChart } from "../../components/charts/AttendanceTrendChart";
import { FleetStatusChart } from "../../components/charts/FleetStatusChart";
import { InventoryDistributionChart } from "../../components/charts/InventoryDistributionChart";

export function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username;
  const cardsRef = useRef(null);

  const canViewMembers = hasPermission("member.view");
  const canViewAttendance = hasPermission("attendance.view");
  const canViewTransportation = hasPermission("transportation.view");
  const canViewEquipment = hasPermission("equipment.view");

  const currentDateArabic = new Intl.DateTimeFormat("ar-LY", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  // 1. Fetch KPI stats dynamically
  const { data: totalData, isLoading: isTotalLoading } = useMembers({ page_size: 1 }, { enabled: canViewMembers });
  const { data: activeData, isLoading: isActiveLoading } = useMembers({ page_size: 1, service_status: "active" }, { enabled: canViewMembers });
  const { data: leaveData, isLoading: isLeaveLoading } = useMembers({ page_size: 1, service_status: "on_leave" }, { enabled: canViewMembers });
  const { data: pendingData, isLoading: isPendingLoading } = useMembers({ page_size: 1, approval_status: "pending" }, { enabled: canViewMembers });
  const { isLoading: isFactionsLoading } = factionsApi.useList();

  // 2. Fetch recent members
  const { data: recentData, isLoading: isRecentLoading } = useMembers({ page_size: 5, ordering: "-created_at" }, { enabled: canViewMembers });
  const recentMembers = recentData?.results || [];

  const totalCount = totalData?.count ?? 0;
  const activeCount = activeData?.count ?? 0;
  const leaveCount = leaveData?.count ?? 0;

  const isAnyLoading = canViewMembers && (isTotalLoading || isActiveLoading || isPendingLoading || isFactionsLoading);

  useEffect(() => {
    if (!isAnyLoading && cardsRef.current) {
      const tween = staggerIn(cardsRef.current.children, { y: 15, duration: 0.3 });
      return () => {
        if (tween) tween.kill();
      };
    }
  }, [isAnyLoading]);

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-caption font-semibold text-slate-500 dark:text-gray-400">
              <Calendar className="h-4 w-4 text-[#2B95E8]" />
              <span>{currentDateArabic}</span>
            </div>
            <h1 className="text-title font-bold text-slate-900 dark:text-white tracking-tight">
              أهلاً بك، {displayName} 👋
            </h1>
            <p className="text-body-sm text-slate-600 dark:text-gray-300 max-w-2xl font-normal">
              لوحة التحكم الرئيسية لإدارة السجلات، شؤون الأفراد، والمستودع بالجهاز الوطني للقوى المساندة.
            </p>
          </div>

          {canViewMembers && (
            <div className="flex items-center gap-3 shrink-0">
              {hasPermission("member.create") && (
                <Link to="/members/new">
                  <Button size="default" className="font-medium shadow-md">
                    <UserPlus className="me-1.5 h-4 w-4" />
                    تسجيل فرد جديد
                  </Button>
                </Link>
              )}
              <Link to="/members">
                <Button variant="outline" size="default" className="font-medium">
                  <FileText className="me-1.5 h-4 w-4" />
                  السجل العام
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid (Rendered for permitted users) */}
      {canViewMembers && (
        <div ref={cardsRef} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي القوة المسجلة"
            value={totalCount}
            subtitle="كافة الأفراد والضباط بالوحدة"
            icon={Users}
            variant="navy"
            loading={isTotalLoading}
          />
          <StatCard
            title="القوة العاملة بالخدمة"
            value={activeCount}
            subtitle="الأفراد على رأس العمل حالياً"
            icon={UserCheck}
            variant="default"
            tone="success"
            loading={isActiveLoading}
          />
          <StatCard
            title="الأفراد في إجازة / راحة"
            value={leaveCount}
            subtitle="إجازات رسمية وراحات نوبة"
            icon={Calendar}
            variant="gradient"
            loading={isLeaveLoading}
          />
          <StatCard
            title="معاملات بانتظار الاعتماد"
            value={pendingData?.count ?? 0}
            subtitle="طلبات تحتاج لمراجعة المدير"
            icon={ShieldAlert}
            variant="default"
            tone="danger"
            loading={isPendingLoading}
            pulse={(pendingData?.count ?? 0) > 0}
          />
        </div>
      )}

      {/* Main Dashboard Layout split */}
      {canViewMembers && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Members widget */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-title font-bold">أحدث الأفراد المسجلين</CardTitle>
                <CardDescription className="text-caption">سجل ببيانات آخر الأفراد المضافين للمنظومة الإدارية</CardDescription>
              </div>
              <Link
                to="/members"
                className="text-caption font-bold text-[#2B95E8] hover:underline flex items-center gap-1 bg-blue-50 dark:bg-white/5 hover:bg-blue-100 dark:hover:bg-white/10 px-3.5 py-1.5 rounded-xl transition-colors"
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
                <p className="text-center py-6 text-caption text-slate-500 font-medium">لا يوجد أعضاء مسجلين بعد.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-caption">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                        <th className="py-2.5 text-start font-semibold">الاسم الكامل</th>
                        <th className="py-2.5 text-start font-semibold">الرقم الحربي</th>
                        <th className="py-2.5 text-start font-semibold">الإدارة</th>
                        <th className="py-2.5 text-start font-semibold">تاريخ القيد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recentMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">
                            <Link to={`/members/${member.id}`} className="hover:text-blue-600 flex items-center gap-1.5">
                              <span>{member.full_name}</span>
                              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                            </Link>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300 font-mono font-bold" data-num>{member.force_number}</td>
                          <td className="py-3 text-slate-500 font-medium">{member.faction_name || "—"}</td>
                          <td className="py-3 text-caption text-slate-500 font-medium">{formatDate(member.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Administrative Quick Shortcuts Widget */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-section font-bold">روابط وإجراءات سريعة</CardTitle>
              <CardDescription className="text-caption">وصول سريع لمهام وأقسام الإدارة اليومية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {hasPermission("member.create") && (
                <Link
                  to="/members/new"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-slate-900 dark:text-slate-100"
                >
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div className="text-start">
                    <p className="font-bold text-label">إضافة فرد جديد</p>
                    <p className="text-caption text-slate-500">إدخال سجل إداري جديد للقوة المساندة</p>
                  </div>
                </Link>
              )}

              {hasPermission("organization.manage") && (
                <Link
                  to="/organization/factions"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-slate-900 dark:text-slate-100"
                >
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="text-start">
                    <p className="font-bold text-label">إدارة القطاعات والإدارات</p>
                    <p className="text-caption text-slate-500">عرض وتوزيع الوحدات والإدارات التنظيمية</p>
                  </div>
                </Link>
              )}

              {hasPermission("audit.view") && (
                <Link
                  to="/audit"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-slate-900 dark:text-slate-100"
                >
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl shrink-0">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="text-start">
                    <p className="font-bold text-label">سجل المراجعة والتدقيق</p>
                    <p className="text-caption text-slate-500">تتبع كافة التعديلات والأنشطة الإدارية</p>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visual Analytics & Performance Charts Section */}
      <div className="space-y-6">
        {canViewAttendance && <AttendanceTrendChart />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {canViewTransportation && <FleetStatusChart />}
          {canViewEquipment && <InventoryDistributionChart />}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
