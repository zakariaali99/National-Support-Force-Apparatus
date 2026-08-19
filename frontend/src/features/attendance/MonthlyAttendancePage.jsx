import React, { useState, useMemo } from "react";
import { useMonthlyMatrix } from "./api";
import { useFactions } from "../organization/api";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Pagination } from "../../components/ui/Pagination";
import { showToast } from "../../components/ui/Toast";
import { openAuthedPdf, downloadAuthedFile } from "../reports/api";
import { printAuthedHtml } from "../../lib/printUtils";
import { MemberMonthCalendarDialog } from "./MemberMonthCalendarDialog";
import {
  FileSpreadsheet,
  Printer,
  Download,
  Loader2,
  Search,
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

const MONTH_NAMES = [
  { value: "1", label: "يناير (1)" },
  { value: "2", label: "فبراير (2)" },
  { value: "3", label: "مارس (3)" },
  { value: "4", label: "أبريل (4)" },
  { value: "5", label: "مايو (5)" },
  { value: "6", label: "يونيو (6)" },
  { value: "7", label: "يوليو (7)" },
  { value: "8", label: "أغسطس (8)" },
  { value: "9", label: "سبتمبر (9)" },
  { value: "10", label: "أكتوبر (10)" },
  { value: "11", label: "نوفمبر (11)" },
  { value: "12", label: "ديسمبر (12)" },
];

const STATUS_CHIPS = {
  present: { code: "ح", bg: "bg-emerald-500", text: "text-white", title: "حاضر" },
  late: { code: "ت", bg: "bg-amber-500", text: "text-white", title: "متأخر" },
  early_departure: { code: "ص", bg: "bg-amber-500", text: "text-white", title: "انصراف مبكر" },
  excused_absence: { code: "ذ", bg: "bg-sky-500", text: "text-white", title: "غياب بإذن / استئذان" },
  unexcused_absence: { code: "غ", bg: "bg-rose-500", text: "text-white", title: "غياب بدون إذن" },
  shift_off: { code: "ر", bg: "bg-slate-300 dark:bg-slate-700", text: "text-slate-700 dark:text-slate-300", title: "راحة نوبة" },
  vacation: { code: "ج", bg: "bg-purple-500", text: "text-white", title: "إجازة رسمية" },
  mission: { code: "م", bg: "bg-indigo-500", text: "text-white", title: "مأمورية" },
  unrecorded: { code: "—", bg: "bg-slate-100 dark:bg-white/5", text: "text-slate-300 dark:text-slate-700", title: "غير مسجل" },
};

export function MonthlyAttendancePage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedFaction, setSelectedFaction] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedMemberForCalendar, setSelectedMemberForCalendar] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: factions = [] } = useFactions();

  const queryParams = useMemo(() => {
    const params = { year: selectedYear, month: selectedMonth };
    if (selectedFaction !== "all") params.faction = selectedFaction;
    return params;
  }, [selectedYear, selectedMonth, selectedFaction]);

  const { data: matrixData, isLoading, refetch, isRefetching } = useMonthlyMatrix(queryParams);

  const daysInMonth = matrixData?.days_in_month || 30;
  const rawRows = matrixData?.rows || matrixData?.matrix || [];

  // Filter rows by search keyword locally
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rawRows;
    const q = search.trim().toLowerCase();
    return rawRows.filter(
      (r) =>
        r.member_name?.toLowerCase().includes(q) ||
        r.force_number?.toLowerCase().includes(q) ||
        r.rank_name?.toLowerCase().includes(q)
    );
  }, [rawRows, search]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  // Aggregate monthly totals for KPIs
  const monthlyKpis = useMemo(() => {
    let totalPresent = 0;
    let totalLateHours = 0;
    let totalExcusedHours = 0;
    let totalUnexcused = 0;
    let totalExpectedDays = rawRows.length * daysInMonth;

    rawRows.forEach((r) => {
      totalPresent += r.summary?.total_present || 0;
      totalLateHours += r.summary?.total_late_hours || 0;
      totalExcusedHours += r.summary?.total_excused_hours || 0;
      totalUnexcused += r.summary?.total_unexcused || 0;
    });

    const attendanceRate = totalExpectedDays > 0 ? Math.round((totalPresent / totalExpectedDays) * 100) : 0;
    return { totalPresent, totalLateHours, totalExcusedHours, totalUnexcused, attendanceRate };
  }, [rawRows, daysInMonth]);

  const currentMonthLabel = MONTH_NAMES.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  const buildPdfParams = () => {
    const params = new URLSearchParams({
      year: selectedYear,
      month: selectedMonth,
    });
    if (selectedFaction !== "all") params.set("faction", selectedFaction);
    return params.toString();
  };

  const handlePrint = () => {
    try {
      printAuthedHtml(`reports/attendance/monthly/pdf/?${buildPdfParams()}`);
    } catch {
      showToast("تعذر فتح كشف التمام الشهري في تبويب جديد", "error");
    }
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    try {
      await downloadAuthedFile(
        `reports/attendance/monthly/pdf/?${buildPdfParams()}`,
        `كشف_التمام_الشهري_${selectedYear}_${selectedMonth}.pdf`
      );
      showToast("تم بدء تنزيل كشف التمام الشهري (PDF)", "success");
    } catch {
      showToast("تعذر تنزيل ملف PDF", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (!rawRows.length) return;

    const headers = [
      "الرقم العسكري",
      "الاسم الكامل",
      "الرتبة",
      "الفصيل",
      ...Array.from({ length: daysInMonth }, (_, i) => `يوم ${i + 1}`),
      "إجمالي الحضور",
      "ساعات التأخير",
      "ساعات الاستئذان",
      "أيام خصم الإجازة",
      "الغياب بدون إذن",
    ];

    const csvRows = [headers.join(",")];

    rawRows.forEach((r) => {
      const daysArr = Array.from({ length: daysInMonth }, (_, i) => {
        const d = r.days[String(i + 1)];
        return d ? STATUS_CHIPS[d.status]?.title || d.status : "—";
      });

      const rowData = [
        `"${r.force_number || ""}"`,
        `"${r.member_name || ""}"`,
        `"${r.rank_name || ""}"`,
        `"${r.faction_name || ""}"`,
        ...daysArr,
        r.summary.total_present,
        r.summary.total_late_hours,
        r.summary.total_excused_hours,
        r.summary.total_deducted_days,
        r.summary.total_unexcused,
      ];
      csvRows.push(rowData.join(","));
    });

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تمام_شهري_${selectedYear}_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 print:hidden" dir="rtl">
      {/* Page Header & Actions */}
      <PageHeader
        title="مصفوفة التمام والغياب الشهري"
        description="سجل الانضباط الشهري والخريطة التفاعلية الشاملة لكافة أفراد القوة على مدار أيام الشهر مع كشوفات الطباعة العرضية المعتمدة."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-1.5 rounded-2xl font-bold border-slate-200/80 dark:border-white/10"
            disabled={isLoading || isRefetching}
            title="تحديث بيانات التمام الشهري ومزامنتها فورياً"
          >
            <RotateCcw className={`w-4 h-4 ${isRefetching ? "animate-spin text-[#2B95E8]" : ""}`} />
            <span>تحديث التمام</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="gap-1.5 rounded-2xl font-bold border-slate-200/80 dark:border-white/10"
            disabled={rawRows.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>تصدير Excel</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            className="gap-1.5 rounded-2xl font-bold border-slate-200/80 dark:border-white/10 text-[#2B95E8]"
            disabled={rawRows.length === 0 || isProcessing}
          >
            <Download className="w-4 h-4" />
            <span>تحميل PDF (عرضي)</span>
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            className="gap-1.5 rounded-2xl font-bold"
            disabled={rawRows.length === 0 || isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>طباعة كشف التمام (Landscape)</span>
          </Button>
        </div>
      </PageHeader>

      {/* Monthly KPIs Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="نسبة الانضباط والحضور"
          value={`${monthlyKpis.attendanceRate}%`}
          subtitle={`إجمالي حضور: ${monthlyKpis.totalPresent} يوم`}
          icon={UserCheck}
          variant="navy"
        />
        <StatCard
          title="ساعات التأخير للشهر"
          value={`${monthlyKpis.totalLateHours} س`}
          subtitle="مجموع ساعات التأخر عن النوبات"
          icon={Clock}
          variant="default"
          tone={monthlyKpis.totalLateHours > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title="ساعات الاستئذان المعتمدة"
          value={`${monthlyKpis.totalExcusedHours} س`}
          subtitle="أذونات خروج رسمية موثقة"
          icon={Calendar}
          variant="default"
          tone="blue"
        />
        <StatCard
          title="الغياب غير المبرر"
          value={`${monthlyKpis.totalUnexcused} يوم`}
          subtitle="حالات غياب بدون إذن رسمي"
          icon={AlertTriangle}
          variant="default"
          tone={monthlyKpis.totalUnexcused > 0 ? "danger" : "neutral"}
        />
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="ابحث بالاسم الكامل، الرقم العسكري، أو الرتبة..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pr-10 rounded-2xl h-11 text-body-sm"
            />
          </div>

          {/* Year */}
          <div className="md:col-span-2">
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
              options={[
                { value: "2025", label: "سنة 2025" },
                { value: "2026", label: "سنة 2026" },
                { value: "2027", label: "سنة 2027" },
              ]}
            />
          </div>

          {/* Month */}
          <div className="md:col-span-3">
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
              options={MONTH_NAMES}
            />
          </div>

          {/* Faction */}
          <div className="md:col-span-3">
            <Select
              value={selectedFaction}
              onValueChange={setSelectedFaction}
              options={[
                { value: "all", label: "كافة الفصائل والوحدات" },
                ...factions.map((f) => ({ value: String(f.id), label: f.name_ar })),
              ]}
            />
          </div>
        </div>

        {/* Legend Ribbon */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-caption">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 font-bold">
            <span>دليل حالات التمام:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-micro">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              حاضر
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-micro">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              متأخر
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold text-micro">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
              مأذون
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-micro">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              غياب
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 font-bold text-micro">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              راحة نوبة
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-micro">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              إجازة
            </span>
          </div>
        </div>
      </div>

      {/* Executive Attendance Table — ZERO Horizontal Scroll */}
      <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-right text-body-sm border-collapse">
            <thead className="bg-slate-50/90 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-gray-300 font-bold text-caption">
              <tr>
                <th className="px-3.5 py-3 text-start w-52">الفرد والرتبة</th>
                <th className="px-3 py-3 text-start w-36">الفصيل والمناوبة</th>
                <th className="px-3 py-3 text-center">
                  خريطة أيام الشهر ({daysInMonth} يوم)
                </th>
                <th className="px-2.5 py-3 text-center w-20 text-emerald-700 dark:text-emerald-400 font-bold">
                  حضور
                </th>
                <th className="px-2 py-3 text-center w-16 text-amber-700 dark:text-amber-400 font-bold">
                  تأخير
                </th>
                <th className="px-2 py-3 text-center w-16 text-sky-700 dark:text-sky-400 font-bold">
                  إذن
                </th>
                <th className="px-2 py-3 text-center w-16 text-rose-700 dark:text-rose-400 font-bold">
                  غياب
                </th>
                <th className="px-3 py-3 text-center w-20">التقويم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 dark:text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2B95E8]" />
                    <span>جاري تحميل بيانات التمام والانضباط الشهري...</span>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 dark:text-gray-400">
                    لا توجد بيانات تمام مسجلة تطابق خيارات البحث لشهر {currentMonthLabel} {selectedYear}.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr
                    key={row.member_id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => setSelectedMemberForCalendar({ ...row, month: selectedMonth })}
                  >
                    {/* Member */}
                    <td className="px-3.5 py-2.5 align-middle">
                      <div className="font-bold text-slate-900 dark:text-white text-body-sm">
                        {row.member_name}
                      </div>
                      <div className="text-slate-500 dark:text-gray-400 text-caption font-mono flex items-center gap-1.5">
                        <span>{row.rank_name || "—"}</span>
                        <span>•</span>
                        <span>{row.force_number || "—"}</span>
                      </div>
                    </td>

                    {/* Faction */}
                    <td className="px-3 py-2.5 align-middle">
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-caption">
                        {row.faction_name || "—"}
                      </div>
                      <div className="text-micro font-mono text-[#2B95E8]">
                        {row.shift_group_name || "إداري"}
                      </div>
                    </td>

                    {/* 31-Day Mini Heatmap Sparkline */}
                    <td className="px-3 py-2.5 align-middle">
                      <div className="flex items-center justify-between gap-0.5 max-w-md mx-auto p-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dayStr = String(i + 1);
                          const dayData = row.days?.[dayStr];
                          const chip = STATUS_CHIPS[dayData?.status] || STATUS_CHIPS.unrecorded;

                          let tooltip = `يوم ${dayStr}: ${chip.title}`;
                          if (dayData?.late_hours > 0) tooltip += ` • تأخير ${dayData.late_hours}س`;
                          if (dayData?.excused_hours > 0) tooltip += ` • إذن ${dayData.excused_hours}س`;
                          if (dayData?.notes) tooltip += ` • (${dayData.notes})`;

                          return (
                            <div
                              key={dayStr}
                              title={tooltip}
                              className={`h-5 flex-1 min-w-[6px] max-w-[14px] rounded-[3px] transition-transform hover:scale-125 cursor-pointer ${chip.bg}`}
                            />
                          );
                        })}
                      </div>
                    </td>

                    {/* Counters */}
                    <td className="px-2.5 py-2.5 align-middle text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10">
                      {row.summary?.total_present || 0}
                    </td>
                    <td className="px-2 py-2.5 align-middle text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                      {row.summary?.total_late_hours > 0 ? `${row.summary.total_late_hours}س` : "0"}
                    </td>
                    <td className="px-2 py-2.5 align-middle text-center font-mono font-bold text-sky-700 dark:text-sky-400">
                      {row.summary?.total_excused_hours > 0 ? `${row.summary.total_excused_hours}س` : "0"}
                    </td>
                    <td className="px-2 py-2.5 align-middle text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                      {row.summary?.total_unexcused || 0}
                    </td>

                    {/* Action Calendar Button */}
                    <td className="px-3 py-2.5 align-middle text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMemberForCalendar({ ...row, month: selectedMonth });
                        }}
                        className="h-7.5 w-7.5 p-0 rounded-lg text-slate-500 hover:text-[#2B95E8]"
                        title="عرض التقويم المفصل للفرد"
                      >
                        <CalendarDays className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={filteredRows.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Member Monthly Calendar Modal */}
      {selectedMemberForCalendar && (
        <MemberMonthCalendarDialog
          memberRecord={selectedMemberForCalendar}
          monthName={currentMonthLabel}
          year={selectedYear}
          daysInMonth={daysInMonth}
          open={Boolean(selectedMemberForCalendar)}
          onOpenChange={(open) => !open && setSelectedMemberForCalendar(null)}
        />
      )}
    </div>
  );
}

export default MonthlyAttendancePage;
