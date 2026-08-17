import React, { useState, useMemo } from "react";
import { useMonthlyMatrix } from "./api";
import { useFactions } from "../organization/api";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { FileSpreadsheet, Printer } from "lucide-react";

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
  present: { code: "ح", bg: "bg-success/15 text-success border-success/30", title: "حاضر" },
  late: { code: "ت", bg: "bg-warning/15 text-warning border-warning/30", title: "متأخر" },
  early_departure: { code: "ص", bg: "bg-warning/15 text-warning border-warning/30", title: "انصراف مبكر" },
  excused_absence: { code: "ذ", bg: "bg-navy/15 text-navy border-navy/30", title: "غياب بإذن / استئذان" },
  unexcused_absence: { code: "غ", bg: "bg-danger/15 text-danger border-danger/30", title: "غياب بدون إذن" },
  shift_off: { code: "ر", bg: "bg-line/40 text-navy-muted border-line", title: "راحة نوبة" },
  vacation: { code: "ج", bg: "bg-gold/15 text-gold-dark border-gold/30", title: "إجازة رسمية" },
  mission: { code: "م", bg: "bg-accent/15 text-accent border-accent/30", title: "مأمورية" },
  unrecorded: { code: "—", bg: "bg-transparent text-navy-muted/50 border-transparent", title: "غير مسجل" },
};

export default function MonthlyAttendancePage() {
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

  const { data: matrixData, isLoading } = useMonthlyMatrix(queryParams);

  const daysInMonth = matrixData?.days_in_month || 30;
  const rows = matrixData?.rows || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!rows.length) return;
    const header = [
      "الرقم العسكري",
      "الاسم الكامل",
      "الرتبة",
      "الفصيل",
      "النوبة",
      ...Array.from({ length: daysInMonth }, (_, i) => `يوم ${i + 1}`),
      "إجمالي الحضور",
      "ساعات التأخير",
      "ساعات الإذن",
      "الأيام المخصومة",
      "غياب بدون إذن",
    ];

    const csvRows = [header.join(",")];

    rows.forEach((r) => {
      const daysArr = Array.from({ length: daysInMonth }, (_, i) => {
        const d = r.days[String(i + 1)];
        return STATUS_CHIPS[d?.status]?.code || "—";
      });

      const rowData = [
        `"${r.force_number || ""}"`,
        `"${r.member_name}"`,
        `"${r.rank_name}"`,
        `"${r.faction_name}"`,
        `"${r.shift_group_name}"`,
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
            <Button variant="outline" onClick={handleExportCSV} className="gap-1.5" disabled={rows.length === 0}>
              <FileSpreadsheet className="w-4 h-4 text-success" />
              <span>تصدير ملف Excel</span>
            </Button>
            <Button variant="primary" onClick={handlePrint} className="gap-1.5" disabled={rows.length === 0}>
              <Printer className="w-4 h-4" />
              <span>طباعة كشف التمام الشهري</span>
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Selector Toolbar */}
      <Card className="bg-surface border-line print:hidden">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Year */}
            <div className="flex items-center gap-2">
              <span className="text-label text-navy">السنة:</span>
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
              <span className="text-label text-navy">الشهر:</span>
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
                options={MONTH_NAMES}
              />
            </div>

            {/* Faction */}
            <div className="flex items-center gap-2 min-w-[220px]">
              <span className="text-label text-navy">الفصيل:</span>
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
            <span className="font-semibold text-navy">دليل الرموز:</span>
            <span className="px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30 font-bold">ح: حاضر</span>
            <span className="px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30 font-bold">ت: متأخر</span>
            <span className="px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30 font-bold">ص: انصراف</span>
            <span className="px-1.5 py-0.5 rounded bg-navy/15 text-navy border border-navy/30 font-bold">ذ: إذن (خصم)</span>
            <span className="px-1.5 py-0.5 rounded bg-danger/15 text-danger border border-danger/30 font-bold">غ: غياب</span>
            <span className="px-1.5 py-0.5 rounded bg-line/40 text-navy-muted border border-line font-bold">ر: راحة</span>
          </div>
        </CardContent>
      </Card>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b border-navy/20 pb-4 mb-4">
        <h2 className="text-title font-bold text-navy">جهاز دعم الاستقرار — الإدارة العامة للشؤون الإدارية</h2>
        <h3 className="text-section font-semibold text-navy-muted">
          كشف التمام الشهري والانضباط — {MONTH_NAMES.find((m) => m.value === selectedMonth)?.label} {selectedYear}
        </h3>
      </div>

      {/* Matrix Table */}
      <Card className="print:border-0 print:shadow-none">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-center text-caption border-collapse">
            <thead className="bg-canvas border-b border-line text-navy font-semibold">
              <tr>
                <th className="p-2 text-right sticky right-0 bg-canvas min-w-[150px] z-10 border-l border-line">
                  الفرد والرتبة
                </th>
                <th className="p-2 min-w-[90px] border-l border-line">الفصيل</th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i + 1} className="p-1 min-w-[28px] border-l border-line/60 font-mono">
                    {i + 1}
                  </th>
                ))}
                <th className="p-2 min-w-[65px] bg-success/10 text-success border-l border-line">حضور</th>
                <th className="p-2 min-w-[65px] bg-warning/10 text-warning border-l border-line">تأخير (س)</th>
                <th className="p-2 min-w-[65px] bg-navy/10 text-navy border-l border-line">إذن (س)</th>
                <th className="p-2 min-w-[70px] bg-danger/10 text-danger border-l border-line">خصم إجازة</th>
                <th className="p-2 min-w-[60px] bg-danger/15 text-danger">غياب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr>
                  <td colSpan={daysInMonth + 7} className="p-8 text-center text-navy-muted">
                    جاري تحميل مصفوفة التمام الشهري...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 7} className="p-8 text-center text-navy-muted">
                    لا توجد بيانات تمام مسجلة لهذا الشهر.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.member_id} className="hover:bg-canvas/40 transition-colors">
                    {/* Member Column */}
                    <td className="p-2 text-right sticky right-0 bg-surface border-l border-line z-10">
                      <div className="font-semibold text-navy text-body-sm">{row.member_name}</div>
                      <div className="text-navy-muted text-caption flex items-center gap-1 font-mono">
                        <span>{row.rank_name}</span>
                        <span>•</span>
                        <span>{row.force_number || "—"}</span>
                      </div>
                    </td>

                    {/* Faction */}
                    <td className="p-2 border-l border-line text-right">
                      <div className="text-caption font-medium text-navy">{row.faction_name || "—"}</div>
                      <div className="text-caption text-gold-dark">{row.shift_group_name}</div>
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
                        <td key={dayStr} className="p-0.5 border-l border-line/60">
                          <span
                            title={tooltip}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded text-caption font-bold border ${chip.bg} transition-transform hover:scale-110`}
                          >
                            {chip.code}
                          </span>
                        </td>
                      );
                    })}

                    {/* Summary Counters */}
                    <td className="p-1 font-bold text-success border-l border-line bg-success/5 font-mono">
                      {row.summary.total_present}
                    </td>
                    <td className="p-1 font-bold text-warning border-l border-line bg-warning/5 font-mono">
                      {row.summary.total_late_hours > 0 ? `${row.summary.total_late_hours}س` : "0"}
                    </td>
                    <td className="p-1 font-bold text-navy border-l border-line bg-navy/5 font-mono">
                      {row.summary.total_excused_hours > 0 ? `${row.summary.total_excused_hours}س` : "0"}
                    </td>
                    <td className="p-1 font-bold text-danger border-l border-line bg-danger/5 font-mono">
                      {row.summary.total_deducted_days > 0 ? `-${row.summary.total_deducted_days}ي` : "0"}
                    </td>
                    <td className="p-1 font-bold text-danger bg-danger/10 font-mono">
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
