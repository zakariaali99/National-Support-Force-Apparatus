import { useMemo } from "react";
import { Package } from "lucide-react";
import { cn } from "../../lib/utils";
import { useInventoryItems } from "../../features/inventory/api";

export function InventoryDistributionChart({ className }) {
  const { data: rawItems } = useInventoryItems({ page_size: 200, domain: "inventory" });
  const items = useMemo(() => {
    return Array.isArray(rawItems) ? rawItems : (rawItems?.results ?? []);
  }, [rawItems]);

  const stats = useMemo(() => {
    let totalQty = 0;
    let availableQty = 0;
    let assignedQty = 0;
    let damagedQty = 0;

    items.forEach((item) => {
      const tot = item.total_quantity || 1;
      totalQty += tot;
      availableQty += item.available_quantity || 0;
      assignedQty += item.assigned_quantity || 0;
      damagedQty += item.damaged_quantity || 0;
    });

    const safeTotal = totalQty > 0 ? totalQty : 1;
    const availablePercent = Math.round((availableQty / safeTotal) * 100);
    const assignedPercent = Math.round((assignedQty / safeTotal) * 100);
    const damagedPercent = Math.round((damagedQty / safeTotal) * 100);

    return {
      totalQty,
      availableQty,
      assignedQty,
      damagedQty,
      availablePercent: totalQty > 0 ? availablePercent : 0,
      assignedPercent: totalQty > 0 ? assignedPercent : 0,
      damagedPercent: totalQty > 0 ? damagedPercent : 0,
      itemTypesCount: items.length,
    };
  }, [items]);

  return (
    <div className={cn("rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-6 lg:p-7 shadow-sm space-y-5", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-white/10 flex items-center justify-center text-[#2B95E8]">
              <Package className="h-4 w-4" />
            </div>
            <h3 className="text-title font-bold text-slate-900 dark:text-white tracking-tight">
              حركة المخزون والعهد العامة
            </h3>
          </div>
          <p className="text-caption text-slate-500 dark:text-gray-400">
            حالة المهمات والتجهيزات العامة بالمستودع مقارنة بالعهد المصروفة
          </p>
        </div>

        <div className="px-3 py-1 bg-blue-50 dark:bg-white/5 border border-blue-200/60 dark:border-white/10 rounded-xl text-caption font-bold text-[#2B95E8]">
          إجمالي: {stats.totalQty} قطعة
        </div>
      </div>

      {/* Progress Ratio Bar */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${stats.availablePercent}%` }}
            className="bg-[#2B95E8] hover:brightness-110 transition-all"
            title={`متاح بالمستودع: ${stats.availablePercent}%`}
          />
          <div
            style={{ width: `${stats.assignedPercent}%` }}
            className="bg-[#5468D4] hover:brightness-110 transition-all"
            title={`مسلم كعهدة: ${stats.assignedPercent}%`}
          />
          <div
            style={{ width: `${stats.damagedPercent}%` }}
            className="bg-rose-500 hover:brightness-110 transition-all"
            title={`تالف / مكهن: ${stats.damagedPercent}%`}
          />
        </div>

        <div className="flex items-center justify-between text-caption font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2B95E8]" />
            <span className="text-slate-700 dark:text-gray-300">متاح بالمستودع ({stats.availablePercent}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5468D4]" />
            <span className="text-slate-700 dark:text-gray-300">مسلم كعهدة ({stats.assignedPercent}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-700 dark:text-gray-300">تالف ({stats.damagedPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Numerical Stats Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-center">
          <p className="text-caption text-slate-500 dark:text-gray-400 font-medium">عدد الأصناف</p>
          <p className="text-title font-bold text-slate-900 dark:text-white font-mono mt-0.5">{stats.itemTypesCount}</p>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 text-center">
          <p className="text-caption text-emerald-700 dark:text-emerald-300 font-medium">المتوفر بالمستودع</p>
          <p className="text-title font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">{stats.availableQty}</p>
        </div>
        <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 text-center">
          <p className="text-caption text-blue-700 dark:text-blue-300 font-medium">العهد المصروفة</p>
          <p className="text-title font-bold text-blue-700 dark:text-blue-300 font-mono mt-0.5">{stats.assignedQty}</p>
        </div>
        <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 text-center">
          <p className="text-caption text-rose-700 dark:text-rose-300 font-medium">تالف ومكهن</p>
          <p className="text-title font-bold text-rose-700 dark:text-rose-300 font-mono mt-0.5">{stats.damagedQty}</p>
        </div>
      </div>
    </div>
  );
}

export default InventoryDistributionChart;
