import { useMemo } from "react";
import { Calendar, User, Clock, ShieldAlert, Award, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

const STATUS_CONFIG = {
  present: { code: "حاضر", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40" },
  late: { code: "متأخر", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40" },
  early_departure: { code: "انصراف مبكر", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40" },
  excused_absence: { code: "مأذون", bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/40" },
  unexcused_absence: { code: "غياب", bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/40" },
  shift_off: { code: "راحة نوبة", bg: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border-slate-200/80 dark:border-white/10" },
  vacation: { code: "إجازة", bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/40" },
  mission: { code: "مأمورية", bg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/40" },
  unrecorded: { code: "—", bg: "bg-slate-50 text-slate-400 dark:bg-white/5 dark:text-gray-500 border-slate-200/40 dark:border-white/5" },
};

const WEEKDAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function MemberMonthCalendarDialog({ memberRecord, monthName, year, daysInMonth, open, onOpenChange }) {
  if (!memberRecord) return null;

  // Build calendar matrix cells with leading empty slots for alignment
  const calendarDays = useMemo(() => {
    if (!year || !daysInMonth) return [];
    // Day 1 of the month
    const firstDayDate = new Date(parseInt(year, 10), parseInt(memberRecord.month || 1, 10) - 1, 1);
    const startDayOfWeek = isNaN(firstDayDate.getDay()) ? 0 : firstDayDate.getDay();

    const days = [];
    // Leading empty slots
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    // Days 1..daysInMonth
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d);
      const dayData = memberRecord.days?.[dayStr] || {};
      const statusKey = dayData.status || "unrecorded";
      days.push({
        empty: false,
        dayNumber: d,
        key: `day-${d}`,
        statusKey,
        config: STATUS_CONFIG[statusKey] || STATUS_CONFIG.unrecorded,
        data: dayData,
      });
    }

    return days;
  }, [memberRecord, year, daysInMonth]);

  const summary = memberRecord.summary || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1A2038] shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-start">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-title font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2B95E8]" />
                <span>تقويم التمام الشهري — {memberRecord.member_name}</span>
              </DialogTitle>
              <DialogDescription className="text-caption text-slate-500 dark:text-gray-400">
                سجل الحضور والانضباط المفصل لشهر {monthName} {year}
              </DialogDescription>
            </div>
            <Badge variant="primary" className="font-bold text-caption">
              {memberRecord.faction_name || "الإدارة العامة"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Member Header Card & Monthly KPIs */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-start">
            <div className="space-y-1">
              <p className="font-bold text-body text-slate-900 dark:text-white">{memberRecord.member_name}</p>
              <p className="text-caption text-slate-500 dark:text-gray-400 font-mono">
                {memberRecord.rank_name} • الرقم العسكري: {memberRecord.force_number || "—"} • المناوبة: {memberRecord.shift_group_name || "إداري"}
              </p>
            </div>

            {/* Monthly Summary Badges */}
            <div className="flex items-center flex-wrap gap-2 text-caption font-bold">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 font-mono">
                حضور: {summary.total_present || 0} يوم
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 font-mono">
                تأخير: {summary.total_late_hours || 0} س
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40 font-mono">
                إذن: {summary.total_excused_hours || 0} س
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40 font-mono">
                غياب: {summary.total_unexcused || 0} يوم
              </span>
            </div>
          </div>

          {/* Monthly Calendar Grid */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-slate-100/90 dark:bg-white/10 border-b border-slate-200/80 dark:border-white/10 text-center py-2 text-caption font-bold text-slate-700 dark:text-slate-200">
              {WEEKDAY_NAMES.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-200/80 dark:bg-white/10">
              {calendarDays.map((item) => {
                if (item.empty) {
                  return <div key={item.key} className="bg-slate-50/50 dark:bg-[#1A2038]/50 min-h-20 p-2" />;
                }

                const { dayNumber, config, data } = item;
                const hasLate = data.late_hours > 0;
                const hasExcused = data.excused_hours > 0;
                const hasNotes = Boolean(data.notes);

                return (
                  <div
                    key={item.key}
                    className="bg-white dark:bg-[#1A2038] min-h-20 p-2 flex flex-col justify-between transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-caption font-bold text-slate-900 dark:text-white">
                        {dayNumber}
                      </span>
                      <span className={`text-micro font-bold px-1.5 py-0.5 rounded border ${config.bg}`}>
                        {config.code}
                      </span>
                    </div>

                    <div className="space-y-0.5 pt-1 text-micro text-start">
                      {hasLate && (
                        <p className="font-mono text-amber-700 dark:text-amber-400 font-bold">
                          +{data.late_hours}س تأخير
                        </p>
                      )}
                      {hasExcused && (
                        <p className="font-mono text-sky-700 dark:text-sky-400 font-bold">
                          {data.excused_hours}س إذن
                        </p>
                      )}
                      {hasNotes && (
                        <p className="text-slate-500 dark:text-gray-400 line-clamp-1" title={data.notes}>
                          📝 {data.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-6 font-bold">
            إغلاق التقويم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
