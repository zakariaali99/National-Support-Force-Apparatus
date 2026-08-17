import { useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";

export function AttendanceTrendChart({ className }) {
  const [period, setPeriod] = useState("7d");

  // Simulated 7-day and 30-day historical trend data based on realistic unit duty ratios
  const data = useMemo(() => {
    if (period === "7d") {
      return [
        { label: "الأحد", present: 94, late: 4, excused: 2, unexcused: 0 },
        { label: "الإثنين", present: 96, late: 2, excused: 2, unexcused: 0 },
        { label: "الثلاثاء", present: 92, late: 5, excused: 3, unexcused: 0 },
        { label: "الأربعاء", present: 95, late: 3, excused: 1, unexcused: 1 },
        { label: "الخميس", present: 90, late: 6, excused: 3, unexcused: 1 },
        { label: "الجمعة (نوبة)", present: 98, late: 1, excused: 1, unexcused: 0 },
        { label: "السبت (نوبة)", present: 97, late: 2, excused: 1, unexcused: 0 },
      ];
    }
    return [
      { label: "أسبوع 1", present: 94, late: 4, excused: 2, unexcused: 0 },
      { label: "أسبوع 2", present: 95, late: 3, excused: 2, unexcused: 0 },
      { label: "أسبوع 3", present: 93, late: 5, excused: 2, unexcused: 0 },
      { label: "أسبوع 4", present: 96, late: 2, excused: 1, unexcused: 1 },
    ];
  }, [period]);

  const maxVal = 100;
  const chartHeight = 160;

  return (
    <div className={cn("rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-6 lg:p-7 shadow-sm space-y-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-white/10 flex items-center justify-center text-[#2B95E8]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-title font-bold text-slate-900 dark:text-white tracking-tight">
              مؤشر انضباط القوة والتمام
            </h3>
          </div>
          <p className="text-caption text-slate-500 dark:text-gray-400">
            معدلات الحضور والانضباط عبر فترات الخدمة المتتالية
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10">
          <button
            type="button"
            onClick={() => setPeriod("7d")}
            className={cn(
              "px-3 py-1 rounded-xl text-caption font-bold transition-all cursor-pointer",
              period === "7d"
                ? "bg-white dark:bg-[#2B95E8] text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            آخر 7 أيام
          </button>
          <button
            type="button"
            onClick={() => setPeriod("30d")}
            className={cn(
              "px-3 py-1 rounded-xl text-caption font-bold transition-all cursor-pointer",
              period === "30d"
                ? "bg-white dark:bg-[#2B95E8] text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            آخر شهر
          </button>
        </div>
      </div>

      {/* Bar & Trend Chart Visualization */}
      <div className="pt-2">
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pb-6 border-b border-slate-100 dark:border-white/10">
          {data.map((item, idx) => {
            const presentHeight = (item.present / maxVal) * chartHeight;
            const lateHeight = (item.late / maxVal) * chartHeight;

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-slate-900 text-white text-caption px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap font-mono">
                  حاضر: {item.present}% | تأخير: {item.late}%
                </div>

                <div className="w-full max-w-[36px] flex flex-col justify-end gap-1 h-full">
                  {/* Late Indicator Bar */}
                  {item.late > 0 && (
                    <div
                      style={{ height: `${Math.max(lateHeight, 4)}px` }}
                      className="w-full bg-amber-400 dark:bg-amber-500 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                    />
                  )}
                  {/* Present Primary Bar */}
                  <div
                    style={{ height: `${presentHeight}px` }}
                    className="w-full bg-gradient-to-t from-[#2B95E8] to-[#5468D4] rounded-2xl transition-all duration-300 group-hover:brightness-110 shadow-xs"
                  />
                </div>
                <span className="text-caption font-medium text-slate-500 dark:text-gray-400 truncate w-full text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-caption font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#2B95E8] to-[#5468D4]" />
            <span className="text-slate-700 dark:text-gray-300">حاضر في الموعد (متوسط 95%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-slate-700 dark:text-gray-300">تأخير بالساعة (متوسط 3%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="text-slate-700 dark:text-gray-300">غياب واستئذان (متوسط 2%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceTrendChart;
