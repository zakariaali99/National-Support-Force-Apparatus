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
import { showToast } from "../../components/ui/Toast";
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
  Printer,
  Search,
  Check,
  X,
  Edit3,
  CalendarCheck,
  Briefcase,
  Coffee,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { printAuthedHtml } from "../../lib/printUtils";
import { AttendanceDetailsDialog } from "./AttendanceDetailsDialog";
import { AttendanceChangeConfirmDialog } from "./AttendanceChangeConfirmDialog";

export function DailyAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedFaction, setSelectedFaction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [localRows, setLocalRows] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [activeDetailsRow, setActiveDetailsRow] = useState(null);

  const handleDirectPrint = () => {
    const q = new URLSearchParams();
    if (selectedDate) q.set("date", selectedDate);
    if (selectedFaction && selectedFaction !== "all") q.set("faction", selectedFaction);
    printAuthedHtml(`reports/attendance/daily/pdf/?${q.toString()}`);
  };

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
          faction_id: item.faction_id,
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
      setIsDirty(false);
    }
  }, [sheetData]);

  // Date Navigation Helpers
  const handleDateChange = (deltaDays) => {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + deltaDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleSetToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Instant Single-Click Row Status Toggle
  const handleSetStatus = (memberId, newStatus) => {
    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.member_id === memberId) {
          const updated = { ...row, status: newStatus };
          if (newStatus === "present") {
            updated.late_hours = 0;
            updated.early_departure_hours = 0;
            updated.excused_hours = 0;
            if (!updated.check_in_time) updated.check_in_time = "08:00";
          }
          return updated;
        }
        return row;
      })
    );
    setIsDirty(true);
  };

  // One-Click "Mark All Present" Action
  const handleMarkAllPresent = () => {
    setLocalRows((prev) =>
      prev.map((row) => {
        // Only set on-duty or non-vacation personnel to present
        if (row.status === "vacation" || row.status === "mission") return row;
        return {
          ...row,
          status: "present",
          late_hours: 0,
          early_departure_hours: 0,
          excused_hours: 0,
          check_in_time: row.check_in_time || "08:00",
        };
      })
    );
    setIsDirty(true);
    showToast("تم تحضير جميع أفراد القوة كـ (حاضر) بنجاح", "success");
  };

  // Save granular details from dialog
  const handleSaveDetails = (memberId, detailsData) => {
    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.member_id === memberId) {
          const updated = { ...row, ...detailsData };
          // Auto-adjust status if hours are present
          if (parseFloat(detailsData.late_hours) > 0 && updated.status === "present") {
            updated.status = "late";
          }
          if (parseFloat(detailsData.excused_hours) > 0) {
            updated.status = "excused_absence";
          }
          return updated;
        }
        return row;
      })
    );
    setIsDirty(true);
    showToast("تم تحديث تفاصيل التمام للفرد", "success");
  };

  const originalMap = useMemo(() => {
    if (!sheetData?.items) return new Map();
    return new Map(sheetData.items.map((item) => [item.member_id, item]));
  }, [sheetData]);

  const isAlreadyRecorded = (sheetData?.recorded_count || 0) > 0;

  const changedRows = useMemo(() => {
    if (!sheetData?.items || localRows.length === 0) return [];
    return localRows.filter((r) => {
      const orig = originalMap.get(r.member_id);
      if (!orig) return true;
      const origStatus = orig.status || (orig.expected_duty === "duty" ? "present" : "shift_off");
      const origLate = parseFloat(orig.late_hours) || 0;
      const origEarly = parseFloat(orig.early_departure_hours) || 0;
      const origExcused = parseFloat(orig.excused_hours) || 0;
      const origCheckIn = orig.check_in_time || (orig.expected_duty === "duty" ? "08:00" : "");
      const origCheckOut = orig.check_out_time || (orig.expected_duty === "duty" ? "14:00" : "");
      const origNotes = orig.notes || "";

      const curLate = parseFloat(r.late_hours) || 0;
      const curEarly = parseFloat(r.early_departure_hours) || 0;
      const curExcused = parseFloat(r.excused_hours) || 0;
      const curCheckIn = r.check_in_time || "";
      const curCheckOut = r.check_out_time || "";
      const curNotes = r.notes || "";

      return (
        r.status !== origStatus ||
        curLate !== origLate ||
        curEarly !== origEarly ||
        curExcused !== origExcused ||
        (curCheckIn && curCheckIn !== origCheckIn) ||
        (curCheckOut && curCheckOut !== origCheckOut) ||
        curNotes !== origNotes
      );
    });
  }, [localRows, sheetData, originalMap]);

  // Execute Save (Full or Changed-only)
  const executeSave = async (rowsToSave) => {
    if (rowsToSave.length === 0) return;

    try {
      await recordBulk.mutateAsync({
        date: selectedDate,
        records: rowsToSave.map((r) => ({
          member_id: r.member_id,
          status: r.status,
          check_in_time: r.check_in_time || null,
          check_out_time: r.check_out_time || null,
          late_hours: parseFloat(r.late_hours) || 0,
          early_departure_hours: parseFloat(r.early_departure_hours) || 0,
          excused_hours: parseFloat(r.excused_hours) || 0,
          notes: r.notes || "",
        })),
      });
      setIsDirty(false);
      setConfirmModalOpen(false);
      showToast(
        rowsToSave.length === localRows.length
          ? `تم حفظ واعتماد تمام (${rowsToSave.length}) فرد بنجاح`
          : `تم حفظ وتحديث تعديل تمام (${rowsToSave.length}) فرد فقط بنجاح`,
        "success"
      );
      refetch();
    } catch {
      showToast("تعذر حفظ التمام، يرجى إعادة المحاولة", "error");
    }
  };

  // Submit and Save Roll-Call handler
  const handleSaveAttendance = () => {
    if (localRows.length === 0) return;

    if (isAlreadyRecorded) {
      if (changedRows.length === 0) {
        showToast("لم يطرأ أي تغيير على كشف التمام المعتمد لهذا اليوم", "info");
        return;
      }
      setConfirmModalOpen(true);
    } else {
      executeSave(localRows);
    }
  };

  // Live Statistics
  const stats = useMemo(() => {
    const total = localRows.length;
    const present = localRows.filter((r) => r.status === "present").length;
    const late = localRows.filter((r) => r.status === "late" || parseFloat(r.late_hours) > 0).length;
    const unexcused = localRows.filter((r) => r.status === "unexcused_absence").length;
    const excused = localRows.filter(
      (r) => r.status === "excused_absence" || parseFloat(r.excused_hours) > 0
    ).length;
    const vacationMission = localRows.filter((r) => r.status === "vacation" || r.status === "mission").length;
    const shiftOff = localRows.filter((r) => r.status === "shift_off").length;

    return { total, present, late, unexcused, excused, vacationMission, shiftOff };
  }, [localRows]);

  // Filtered Rows for search & status pill
  const filteredRows = useMemo(() => {
    return localRows.filter((row) => {
      const matchesSearch =
        !searchQuery.trim() ||
        row.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (row.force_number && row.force_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (row.rank_name && row.rank_name.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === "present") matchesStatus = row.status === "present";
      else if (statusFilter === "late") matchesStatus = row.status === "late" || parseFloat(row.late_hours) > 0;
      else if (statusFilter === "absent") matchesStatus = row.status === "unexcused_absence";
      else if (statusFilter === "excused") matchesStatus = row.status === "excused_absence" || parseFloat(row.excused_hours) > 0;
      else if (statusFilter === "vacation") matchesStatus = row.status === "vacation" || row.status === "mission";
      else if (statusFilter === "off") matchesStatus = row.status === "shift_off";

      return matchesSearch && matchesStatus;
    });
  }, [localRows, searchQuery, statusFilter]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header & Actions */}
      <PageHeader
        title="كشف التمام والانضباط اليومي المباشر"
        description="تحضير وتوثيق حضور وغياب أفراد القوة، النوبات، والتأخيرات بأسلوب إداري سريع ومعتمد."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleDirectPrint}
            className="gap-2 rounded-2xl font-bold border-slate-200/80 dark:border-white/10"
          >
            <Printer className="w-4 h-4 text-[#2B95E8]" />
            <span>طباعة كشف التمام (PDF)</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleMarkAllPresent}
            disabled={localRows.length === 0 || isLoading}
            className="gap-2 rounded-2xl font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>تحضير الكل كـ (حاضر)</span>
          </Button>

          <Button
            variant="primary"
            onClick={handleSaveAttendance}
            disabled={recordBulk.isPending || isLoading || localRows.length === 0}
            className="gap-2 rounded-2xl font-bold shadow-xs px-5"
          >
            <Save className="w-4 h-4" />
            <span>{recordBulk.isPending ? "جاري الحفظ..." : isDirty ? "حفظ التمام (تغييرات معلقة)" : "حفظ واعتماد التمام"}</span>
          </Button>
        </div>
      </PageHeader>

      {/* Control Strip (Date & Faction Selector) */}
      <div className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-4 md:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Date Selector with Quick Step */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange(1)}
            className="rounded-xl px-2.5"
            title="اليوم التالي"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-0 rotate-180" />
          </Button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <Calendar className="w-4 h-4 text-[#2B95E8]" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none bg-transparent h-8 p-0 text-body-sm font-bold font-mono focus:ring-0 cursor-pointer text-slate-900 dark:text-white"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange(-1)}
            className="rounded-xl px-2.5"
            title="اليوم السابق"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSetToday}
            className="rounded-xl text-caption font-bold text-[#2B95E8]"
          >
            اليوم
          </Button>
        </div>

        {/* Faction Filter */}
        <div className="flex items-center gap-3 min-w-[240px]">
          <span className="text-label text-slate-600 dark:text-gray-300 font-bold whitespace-nowrap">الفصيل / الإدارة:</span>
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

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="قوة التمام"
          value={stats.total}
          subtitle="إجمالي القوة"
          icon={Users}
          variant="navy"
        />
        <StatCard
          title="حاضر"
          value={stats.present}
          subtitle="بالخدمة الفعلية"
          icon={CheckCircle2}
          variant="default"
          tone="success"
        />
        <StatCard
          title="متأخر"
          value={stats.late}
          subtitle="تأخير بالساعة"
          icon={Clock}
          variant="default"
          tone="warning"
        />
        <StatCard
          title="غياب بدون إذن"
          value={stats.unexcused}
          subtitle="غياب غير مبرر"
          icon={UserX}
          variant="default"
          tone="danger"
        />
        <StatCard
          title="إذن / إجازات"
          value={stats.excused + stats.vacationMission}
          subtitle="إجازات ومأموريات"
          icon={Briefcase}
          variant="gradient"
        />
        <StatCard
          title="راحة نوبة"
          value={stats.shiftOff}
          subtitle="عطلة مجدولة"
          icon={Coffee}
          variant="default"
        />
      </div>

      {/* Quick Search & Status Filter Pills */}
      <div className="rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Real-time search */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="ابحث بالاسم، الرتبة، أو الرقم العسكري..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 rounded-2xl h-10 text-body-sm"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10">
            {[
              { id: "all", label: "الكل", count: stats.total },
              { id: "present", label: "حاضر", count: stats.present, color: "text-emerald-600" },
              { id: "late", label: "متأخر", count: stats.late, color: "text-amber-600" },
              { id: "absent", label: "غياب", count: stats.unexcused, color: "text-rose-600" },
              { id: "excused", label: "مأذون", count: stats.excused, color: "text-blue-600" },
              { id: "vacation", label: "إجازة/مأمورية", count: stats.vacationMission, color: "text-purple-600" },
              { id: "off", label: "راحة", count: stats.shiftOff, color: "text-slate-500" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-caption font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-white dark:bg-[#1A2038] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10"
                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`font-mono text-caption px-1.5 py-0.2 rounded-md bg-slate-200/60 dark:bg-white/10 ${tab.color || ""}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Roll-Call Table */}
      <Card className="overflow-hidden shadow-sm rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038]">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-body-sm border-collapse">
            <thead className="bg-slate-50/90 dark:bg-white/5 text-slate-500 dark:text-gray-400 font-bold border-b border-slate-200/80 dark:border-white/10 text-caption uppercase">
              <tr>
                <th className="px-3 py-2.5">الفرد والرتبة</th>
                <th className="px-3 py-2.5">الفصيل والوردية</th>
                <th className="px-3 py-2.5">التمام المتوقع</th>
                <th className="px-3 py-2.5 text-center">حالة التمام السريعة (بنقرة واحدة)</th>
                <th className="px-3 py-2.5">التفاصيل والملاحظات</th>
                <th className="px-3 py-2.5 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500 dark:text-gray-400">
                    جاري تحميل كشف قوة الفصيل والتمام...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500 dark:text-gray-400">
                    لا توجد سجلات تطابق معايير البحث والفلترة.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isPresent = row.status === "present";
                  const isLate = row.status === "late" || parseFloat(row.late_hours) > 0;
                  const isAbsent = row.status === "unexcused_absence";
                  const isExcused = row.status === "excused_absence" || parseFloat(row.excused_hours) > 0;
                  const isVacation = row.status === "vacation";
                  const isMission = row.status === "mission";
                  const isOff = row.status === "shift_off";

                  return (
                    <tr
                      key={row.member_id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors ${
                        isAbsent
                          ? "bg-rose-50/30 dark:bg-rose-950/20"
                          : isLate
                          ? "bg-amber-50/30 dark:bg-amber-950/15"
                          : isExcused
                          ? "bg-blue-50/20 dark:bg-blue-950/10"
                          : ""
                      }`}
                    >
                      {/* Member Info */}
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900 dark:text-white text-body-sm">
                          {row.member_name}
                        </div>
                        <div className="text-caption text-slate-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5 font-medium">
                          <span>{row.rank_name || "عضو"}</span>
                          <span>•</span>
                          <span className="font-mono">{row.force_number || "—"}</span>
                        </div>
                      </td>

                      {/* Faction & Shift */}
                      <td className="px-3 py-2">
                        <div className="text-body-sm font-medium text-slate-900 dark:text-white">
                          {row.faction_name || "عام"}
                        </div>
                        <div className="text-caption text-[#2B95E8] font-bold">
                          {row.shift_group_name || "دوام إداري"}
                        </div>
                      </td>

                      {/* Expected Duty */}
                      <td className="px-3 py-2">
                        {row.expected_duty === "duty" ? (
                          <Badge variant="gold" className="text-caption font-bold">
                            واجب
                          </Badge>
                        ) : (
                          <Badge variant="navy" className="text-caption font-semibold">
                            راحة
                          </Badge>
                        )}
                      </td>

                      {/* One-Click Quick Status Selector Pills */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1 p-0.5 bg-slate-100/90 dark:bg-white/5 rounded-xl border border-slate-200/70 dark:border-white/10">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(row.member_id, "present")}
                            className={`px-2.5 py-1 rounded-lg text-caption font-bold transition-all flex items-center gap-1 ${
                              isPresent
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>حاضر</span>
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(row.member_id, "late")}
                            className={`px-2.5 py-1 rounded-lg text-caption font-bold transition-all flex items-center gap-1 ${
                              isLate
                                ? "bg-amber-500 text-white shadow-xs"
                                : "text-slate-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>متأخر</span>
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(row.member_id, "unexcused_absence")}
                            className={`px-2.5 py-1 rounded-lg text-caption font-bold transition-all flex items-center gap-1 ${
                              isAbsent
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400"
                            }`}
                          >
                            <X className="w-3 h-3" />
                            <span>غياب</span>
                          </button>

                          {/* Excused */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(row.member_id, "excused_absence")}
                            className={`px-2 py-1 rounded-lg text-caption font-bold transition-all flex items-center gap-1 ${
                              isExcused
                                ? "bg-sky-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400"
                            }`}
                          >
                            <span>إذن</span>
                          </button>

                          {/* Vacation */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(row.member_id, "vacation")}
                            className={`px-2 py-1 rounded-lg text-caption font-bold transition-all flex items-center gap-1 ${
                              isVacation
                                ? "bg-purple-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                            }`}
                          >
                            <span>إجازة</span>
                          </button>

                          {/* Mission */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(row.member_id, "mission")}
                            className={`px-2 py-1 rounded-lg text-caption font-bold transition-all flex items-center gap-1 ${
                              isMission
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            }`}
                          >
                            <span>مأمورية</span>
                          </button>

                          {/* Shift Off */}
                          <button
                            type="button"
                            onClick={() => handleSetStatus(row.member_id, "shift_off")}
                            className={`px-2 py-1 rounded-lg text-caption font-bold transition-all flex items-center gap-1 ${
                              isOff
                                ? "bg-slate-700 text-white shadow-xs"
                                : "text-slate-600 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                          >
                            <span>راحة</span>
                          </button>
                        </div>
                      </td>

                      {/* Details & Notes Preview */}
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {parseFloat(row.late_hours) > 0 && (
                            <Badge variant="warning" className="text-caption font-mono">
                              تأخير: {row.late_hours}س
                            </Badge>
                          )}
                          {parseFloat(row.excused_hours) > 0 && (
                            <Badge variant="navy" className="text-caption font-mono">
                              إذن: {row.excused_hours}س
                            </Badge>
                          )}
                          {row.check_in_time && (
                            <span className="text-caption font-mono text-slate-500 dark:text-gray-400">
                              {row.check_in_time}
                            </span>
                          )}
                          {row.notes && (
                            <span className="text-caption text-slate-600 dark:text-gray-300 truncate max-w-[130px]" title={row.notes}>
                              {row.notes}
                            </span>
                          )}
                          {!row.notes && !parseFloat(row.late_hours) && !parseFloat(row.excused_hours) && (
                            <span className="text-caption text-slate-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* Edit Details Action */}
                      <td className="px-3 py-2 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveDetailsRow(row)}
                          className="rounded-xl font-bold text-[#2B95E8] gap-1 px-2.5 py-1 text-caption h-7.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تفاصيل</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Granular Attendance Details Dialog */}
      <AttendanceDetailsDialog
        row={activeDetailsRow}
        open={Boolean(activeDetailsRow)}
        onOpenChange={(isOpen) => !isOpen && setActiveDetailsRow(null)}
        onSave={handleSaveDetails}
      />

      {/* Attendance Change Confirmation Dialog (Changed Rows Only) */}
      <AttendanceChangeConfirmDialog
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        date={selectedDate}
        changedRows={changedRows}
        originalMap={originalMap}
        onConfirm={() => executeSave(changedRows)}
        isProcessing={recordBulk.isPending}
      />
    </div>
  );
}

export default DailyAttendancePage;
