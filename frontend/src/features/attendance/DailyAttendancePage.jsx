import React, { useState, useEffect, useMemo } from "react";
import { useDailySheet, useRecordBulkAttendance } from "./api";
import { useFactions } from "../organization/api";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Users,
  CheckCircle2,
  Clock,
  UserX,
  ShieldCheck,
  Save,
  CheckCheck,
  AlertCircle,
} from "lucide-react";

const ATTENDANCE_STATUS_OPTIONS = [
  { value: "present", label: "حاضر" },
  { value: "late", label: "متأخر" },
  { value: "early_departure", label: "انصراف مبكر" },
  { value: "excused_absence", label: "غياب بإذن (يخصم من الإجازات)" },
  { value: "unexcused_absence", label: "غياب بدون إذن" },
  { value: "shift_off", label: "راحة نوبة" },
  { value: "vacation", label: "إجازة رسمية" },
  { value: "mission", label: "مأمورية / تكليف" },
];

export default function DailyAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedFaction, setSelectedFaction] = useState("all");
  const [localRows, setLocalRows] = useState([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const { data: factions = [] } = useFactions();

  const queryParams = useMemo(() => {
    const params = { date: selectedDate };
    if (selectedFaction !== "all") params.faction = selectedFaction;
    return params;
  }, [selectedDate, selectedFaction]);

  const { data: sheetData, isLoading, refetch } = useDailySheet(queryParams);
  const recordBulk = useRecordBulkAttendance();

  useEffect(() => {
    if (sheetData?.items) {
      setLocalRows(
        sheetData.items.map((item) => ({
          member_id: item.member_id,
          member_name: item.member_name,
          force_number: item.force_number,
          rank_name: item.rank_name,
          faction_name: item.faction_name,
          shift_group_name: item.shift_group_name,
          shift_pattern: item.shift_pattern,
          expected_duty: item.expected_duty,
          status: item.status || (item.expected_duty === "duty" ? "present" : "shift_off"),
          check_in_time: item.check_in_time || (item.expected_duty === "duty" ? "08:00" : ""),
          check_out_time: item.check_out_time || (item.expected_duty === "duty" ? "14:00" : ""),
          late_hours: item.late_hours || 0,
          early_departure_hours: item.early_departure_hours || 0,
          excused_hours: item.excused_hours || 0,
          vacation_balance_days: item.vacation_balance_days || 0,
          notes: item.notes || "",
        }))
      );
    }
  }, [sheetData]);

  const handleRowChange = (memberId, field, value) => {
    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.member_id === memberId) {
          const updated = { ...row, [field]: value };
          // Auto-adjust status if hours are changed
          if (field === "late_hours" && parseFloat(value) > 0 && updated.status === "present") {
            updated.status = "late";
          }
          if (field === "early_departure_hours" && parseFloat(value) > 0 && updated.status === "present") {
            updated.status = "early_departure";
          }
          if (field === "excused_hours" && parseFloat(value) > 0) {
            updated.status = "excused_absence";
          }
          return updated;
        }
        return row;
      })
    );
  };

  const markAllOnDutyPresent = () => {
    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.expected_duty === "duty") {
          return {
            ...row,
            status: "present",
            late_hours: 0,
            early_departure_hours: 0,
            excused_hours: 0,
          };
        }
        return row;
      })
    );
  };

  const handleSaveAll = async () => {
    const payload = {
      date: selectedDate,
      records: localRows.map((r) => ({
        member_id: r.member_id,
        status: r.status,
        check_in_time: r.check_in_time || null,
        check_out_time: r.check_out_time || null,
        late_hours: parseFloat(r.late_hours) || 0,
        early_departure_hours: parseFloat(r.early_departure_hours) || 0,
        excused_hours: parseFloat(r.excused_hours) || 0,
        notes: r.notes || "",
      })),
    };

    const res = await recordBulk.mutateAsync(payload);
    setSaveSuccessMsg(res?.message || "تم حفظ التمام اليومي بنجاح وتحديث أرصدة الإجازات.");
    setTimeout(() => setSaveSuccessMsg(""), 5000);
    refetch();
  };

  const navigateDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Summary statistics for current local state
  const stats = useMemo(() => {
    const total = localRows.length;
    const dutyExpected = localRows.filter((r) => r.expected_duty === "duty").length;
    const present = localRows.filter((r) => r.status === "present").length;
    const late = localRows.filter((r) => r.status === "late" || parseFloat(r.late_hours) > 0).length;
    const excused = localRows.filter((r) => r.status === "excused_absence" || parseFloat(r.excused_hours) > 0).length;
    const unexcused = localRows.filter((r) => r.status === "unexcused_absence").length;
    const shiftOff = localRows.filter((r) => r.status === "shift_off").length;
    return { total, dutyExpected, present, late, excused, unexcused, shiftOff };
  }, [localRows]);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="التمام اليومي وحضور القوة"
        description="تسجيل تمام الحضور، التأخير، الانصراف المبكر، والغياب بالساعة مع الاحتساب الآلي لورديات النوبات."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={markAllOnDutyPresent}
            className="gap-1.5"
            disabled={localRows.length === 0}
          >
            <CheckCheck className="w-4 h-4 text-success" />
            <span>تسجيل حضور كافة مستحقي الخدمة</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveAll}
            disabled={recordBulk.isPending || localRows.length === 0}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{recordBulk.isPending ? "جاري الحفظ..." : "حفظ التمام اليومي"}</span>
          </Button>
        </div>
      </PageHeader>

      {/* Date & Faction Filter Card (Niqabaty Floating Style) */}
      <div className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-5 md:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate(1)} title="اليوم التالي" className="rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
            <Calendar className="w-4 h-4 text-[#2B95E8]" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 p-0 h-auto font-mono text-body-sm font-bold text-slate-900 dark:text-white bg-transparent focus:ring-0 shadow-none hover:bg-transparent"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateDate(-1)} title="اليوم السابق" className="rounded-xl">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="rounded-xl text-[#2B95E8] font-bold"
          >
            اليوم
          </Button>
        </div>

        <div className="flex items-center gap-3 min-w-[260px]">
          <span className="text-body-sm text-slate-700 dark:text-gray-300 font-semibold shrink-0">الفصيل:</span>
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

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-semibold text-body-sm">{saveSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="إجمالي القوة" value={stats.total} icon={Users} variant="navy" />
        <StatCard title="المستحقون للخدمة" value={stats.dutyExpected} icon={ShieldCheck} variant="gradient" />
        <StatCard title="حاضر" value={stats.present} icon={CheckCircle2} variant="default" tone="success" />
        <StatCard title="تأخير بالساعة" value={stats.late} icon={Clock} variant="default" tone="warning" />
        <StatCard title="غياب مأذون" value={stats.excused} icon={AlertCircle} variant="default" tone="warning" />
        <StatCard title="غياب بدون إذن" value={stats.unexcused} icon={UserX} variant="default" tone="danger" />
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-body-sm border-collapse">
            <thead className="bg-slate-50/90 dark:bg-white/5 text-slate-500 font-bold border-b border-slate-200/80 dark:border-white/10 text-caption uppercase">
              <tr>
                <th className="p-3.5">الفرد والرتبة</th>
                <th className="p-3.5">الفصيل والنوبة</th>
                <th className="p-3.5">التمام المتوقع</th>
                <th className="p-3.5 min-w-[170px]">حالة التمام الفعلية</th>
                <th className="p-3.5 min-w-[90px]">التأخير (ساعة)</th>
                <th className="p-3.5 min-w-[90px]">الانصراف المبكر</th>
                <th className="p-3.5 min-w-[120px]">إذن / غياب بالساعة</th>
                <th className="p-3.5">الخصم من الرصيد</th>
                <th className="p-3.5 min-w-[180px]">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    جاري تحميل جدول التمام وقوة الفصيل...
                  </td>
                </tr>
              ) : localRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    لا يوجد أفراد مسجلون في الفصيل المختار.
                  </td>
                </tr>
              ) : (
                localRows.map((row) => {
                  const excusedNum = parseFloat(row.excused_hours) || 0;
                  const calculatedDeduction =
                    row.status === "excused_absence"
                      ? excusedNum > 0
                        ? (excusedNum / 8.0).toFixed(2)
                        : "1.00"
                      : "0.00";

                  return (
                    <tr
                      key={row.member_id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        row.status === "unexcused_absence"
                          ? "bg-rose-50/30 dark:bg-rose-950/15"
                          : row.status === "excused_absence"
                          ? "bg-amber-50/20 dark:bg-amber-950/10"
                          : ""
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-body-sm">{row.member_name}</div>
                        <div className="text-caption text-slate-500 flex items-center gap-1.5">
                          <span>{row.rank_name || "—"}</span>
                          <span>•</span>
                          <span className="font-mono">{row.force_number || "—"}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-body-sm text-slate-900 dark:text-slate-100 font-medium">{row.faction_name || "—"}</div>
                        <div className="text-caption text-blue-600 dark:text-blue-400 font-medium">{row.shift_group_name}</div>
                      </td>
                      <td className="p-3">
                        {row.expected_duty === "duty" ? (
                          <Badge variant="gold">واجب / خدمة</Badge>
                        ) : (
                          <Badge variant="secondary">راحة نوبة</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Select
                          value={row.status}
                          onValueChange={(val) => handleRowChange(row.member_id, "status", val)}
                          options={ATTENDANCE_STATUS_OPTIONS}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={row.late_hours}
                          onChange={(e) => handleRowChange(row.member_id, "late_hours", e.target.value)}
                          className="w-20 font-mono text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={row.early_departure_hours}
                          onChange={(e) =>
                            handleRowChange(row.member_id, "early_departure_hours", e.target.value)
                          }
                          className="w-20 font-mono text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={row.excused_hours}
                          onChange={(e) => handleRowChange(row.member_id, "excused_hours", e.target.value)}
                          className="w-24 font-mono text-center"
                          placeholder="ساعات"
                        />
                      </td>
                      <td className="p-3 font-mono">
                        {parseFloat(calculatedDeduction) > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 font-bold text-caption">
                            -{calculatedDeduction} يوم
                          </span>
                        ) : (
                          <span className="text-slate-400 text-caption">0</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Input
                          value={row.notes}
                          onChange={(e) => handleRowChange(row.member_id, "notes", e.target.value)}
                          placeholder="سبب التأخير أو رقم الإذن..."
                          className="text-caption"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
