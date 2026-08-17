import React, { useState, useMemo } from "react";
import { useMonthlyMatrix } from "./api";
import { useFactions } from "../organization/api";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { showToast } from "../../components/ui/Toast";
import { openAuthedPdf, downloadAuthedFile } from "../reports/api";
import { FileSpreadsheet, Printer, Download, Loader2 } from "lucide-react";

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
  present: { code: "ح", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40", title: "حاضر" },
  late: { code: "ت", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40", title: "متأخر" },
  early_departure: { code: "ص", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40", title: "انصراف مبكر" },
  excused_absence: { code: "ذ", bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40", title: "غياب بإذن / استئذان" },
  unexcused_absence: { code: "غ", bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40", title: "غياب بدون إذن" },
  shift_off: { code: "ر", bg: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200/40 dark:border-slate-700/40", title: "راحة نوبة" },
  vacation: { code: "ج", bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40", title: "إجازة رسمية" },
  mission: { code: "م", bg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40", title: "مأمورية" },
  unrecorded: { code: "—", bg: "bg-transparent text-slate-300 dark:text-slate-700 border-transparent", title: "غير مسجل" },
};

export function MonthlyAttendancePage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedFaction, setSelectedFaction] = useState("all");

  const { data: factions = [] } = useFactions();

  const queryParams = useMemo(() => {
    const params = { year: selectedYear, month: selectedMonth };
    if (selectedFaction !== "all") params.faction = selectedFaction;
    return params;
  }, [selectedYear, selectedMonth, selectedFaction]);

  const [isProcessing, setIsProcessing] = useState(false);
  const { data: matrixData, isLoading } = useMonthlyMatrix(queryParams);

  const daysInMonth = matrixData?.days_in_month || 30;
  const rows = matrixData?.matrix || [];

  const buildPdfParams = () => {
    const params = new URLSearchParams({
      year: selectedYear,
      month: selectedMonth,
    });
    if (selectedFaction !== "all") params.set("faction", selectedFaction);
    return params.toString();
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    try {
      await openAuthedPdf(`reports/attendance/monthly/pdf/?${buildPdfParams()}`);
    } catch {
      showToast("تعذر فتح كشف التمام الشهري في تبويب جديد", "error");
    } finally {
      setIsProcessing(false);
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
    if (!rows.length) return;

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

    rows.forEach((r) => {
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
    <div className="space-y-6 print:p-0 print:space-y-2" dir="rtl">
      <div className="print:hidden">
        <PageHeader
          title="مصفوفة التمام والغياب الشهري"
          description="عرض مصفوفة التمام الشاملة لكافة أفراد القوة على مدار أيام الشهر مع الإحصائيات وساعات التأخير والخصومات."
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="gap-1.5 rounded-xl font-bold" disabled={rows.length === 0}>
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير Excel</span>
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf} className="gap-1.5 rounded-xl font-bold text-[#2B95E8]" disabled={rows.length === 0 || isProcessing}>
              <Download className="w-4 h-4" />
              <span>تحميل مستند PDF</span>
            </Button>
            <Button variant="primary" onClick={handlePrint} className="gap-1.5 rounded-xl font-bold" disabled={rows.length === 0 || isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              <span>طباعة كشف التمام</span>
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Selector Toolbar */}
      <Card className="print:hidden">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Year */}
            <div className="flex items-center gap-2">
              <span className="text-label text-slate-700 dark:text-slate-300 font-semibold">السنة:</span>
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
                options={[
                  { value: "2025", label: "2025" },
                  { value: "2026", label: "2026" },
                  { value: "2027", label: "2027" },
                ]}
              />
            </div>

            {/* Month */}
            <div className="flex items-center gap-2 min-w-[160px]">
              <span className="text-label text-slate-700 dark:text-slate-300 font-semibold">الشهر:</span>
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
                options={MONTH_NAMES}
              />
            </div>

            {/* Faction */}
            <div className="flex items-center gap-2 min-w-[220px]">
              <span className="text-label text-slate-700 dark:text-slate-300 font-semibold">الفصيل:</span>
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

          {/* Legend Guide */}
          <div className="flex flex-wrap items-center gap-2 text-caption">
            <span className="font-semibold text-slate-700 dark:text-slate-300">دليل الرموز:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold">ح: حاضر</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-bold">ت: متأخر</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-bold">ص: انصراف</span>
            <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 font-bold">ذ: إذن</span>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 font-bold">غ: غياب</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200/60 font-bold">ر: راحة</span>
          </div>
        </CardContent>
      </Card>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b border-slate-200 pb-4 mb-4">
        <h2 className="text-title font-bold text-slate-900">الجهاز الوطني للقوى المساندة — الإدارة العامة للشؤون الإدارية</h2>
        <h3 className="text-section font-semibold text-slate-600">
          كشف التمام الشهري والانضباط — {MONTH_NAMES.find((m) => m.value === selectedMonth)?.label} {selectedYear}
        </h3>
      </div>

      {/* Matrix Table */}
      <Card className="print:border-0 print:shadow-none overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038]">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-center text-caption border-collapse">
            <thead className="bg-slate-50/90 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-gray-300 font-semibold">
              <tr>
                <th className="p-2.5 text-right sticky right-0 bg-slate-50 dark:bg-[#1A2038] min-w-[160px] z-10 border-l border-slate-200/80 dark:border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                  الفرد والرتبة
                </th>
                <th className="p-2.5 min-w-[90px] border-l border-slate-200/80 dark:border-white/10">الفصيل</th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i + 1} className="p-1 min-w-[28px] border-l border-slate-200/60 dark:border-white/10 font-mono">
                    {i + 1}
                  </th>
                ))}
                <th className="p-2 min-w-[65px] bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-l border-slate-200/80 dark:border-white/10">حضور</th>
                <th className="p-2 min-w-[65px] bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-l border-slate-200/80 dark:border-white/10">تأخير (س)</th>
                <th className="p-2 min-w-[65px] bg-sky-50/60 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border-l border-slate-200/80 dark:border-white/10">إذن (س)</th>
                <th className="p-2 min-w-[70px] bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-l border-slate-200/80 dark:border-white/10">خصم إجازة</th>
                <th className="p-2 min-w-[60px] bg-rose-100/60 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200">غياب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={daysInMonth + 7} className="p-8 text-center text-slate-500">
                    جاري تحميل مصفوفة التمام الشهري...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 7} className="p-8 text-center text-slate-500">
                    لا توجد بيانات تمام مسجلة لهذا الشهر.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.member_id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                    {/* Member Column */}
                    <td className="p-2.5 text-right sticky right-0 bg-surface dark:bg-[#1A2038] border-l border-slate-200/80 dark:border-white/10 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-body-sm">{row.member_name}</div>
                      <div className="text-slate-500 text-caption flex items-center gap-1 font-mono">
                        <span>{row.rank_name}</span>
                        <span>•</span>
                        <span>{row.force_number || "—"}</span>
                      </div>
                    </td>

                    {/* Faction */}
                    <td className="p-2 border-l border-slate-200/80 dark:border-slate-800 text-right">
                      <div className="text-caption font-medium text-slate-800 dark:text-slate-200">{row.faction_name || "—"}</div>
                      <div className="text-caption text-blue-600 dark:text-blue-400 font-mono">{row.shift_group_name}</div>
                    </td>

                    {/* Days 1..daysInMonth */}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const dayStr = String(i + 1);
                      const dayData = row.days[dayStr];
                      const chip = STATUS_CHIPS[dayData?.status] || STATUS_CHIPS.unrecorded;

                      let tooltip = `${chip.title} (يوم ${dayStr})`;
                      if (dayData?.late_hours > 0) tooltip += ` • تأخير ${dayData.late_hours} س`;
                      if (dayData?.excused_hours > 0) tooltip += ` • إذن ${dayData.excused_hours} س (خصم ${dayData.deducted_days} يوم)`;

                      return (
                        <td key={dayStr} className="p-0.5 border-l border-slate-100 dark:border-slate-800">
                          <span
                            title={tooltip}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-caption font-bold border ${chip.bg} transition-transform hover:scale-110`}
                          >
                            {chip.code}
                          </span>
                        </td>
                      );
                    })}

                    {/* Summary Counters */}
                    <td className="p-1 font-bold text-emerald-700 dark:text-emerald-400 border-l border-slate-200/80 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/20 font-mono">
                      {row.summary.total_present}
                    </td>
                    <td className="p-1 font-bold text-amber-700 dark:text-amber-400 border-l border-slate-200/80 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/20 font-mono">
                      {row.summary.total_late_hours > 0 ? `${row.summary.total_late_hours}س` : "0"}
                    </td>
                    <td className="p-1 font-bold text-sky-700 dark:text-sky-400 border-l border-slate-200/80 dark:border-slate-800 bg-sky-50/30 dark:bg-sky-950/20 font-mono">
                      {row.summary.total_excused_hours > 0 ? `${row.summary.total_excused_hours}س` : "0"}
                    </td>
                    <td className="p-1 font-bold text-rose-700 dark:text-rose-400 border-l border-slate-200/80 dark:border-slate-800 bg-rose-50/30 dark:bg-rose-950/20 font-mono">
                      {row.summary.total_deducted_days > 0 ? `-${row.summary.total_deducted_days}ي` : "0"}
                    </td>
                    <td className="p-1 font-bold text-rose-700 dark:text-rose-400 bg-rose-100/40 dark:bg-rose-950/30 font-mono">
                      {row.summary.total_unexcused}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default MonthlyAttendancePage;
