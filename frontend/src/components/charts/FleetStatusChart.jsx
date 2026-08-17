import { useMemo } from "react";
import { Car, ShieldCheck, Wrench, ShieldAlert } from "lucide-react";
import { cn } from "../../lib/utils";
import { useVehicles } from "../../features/transportation/api";

export function FleetStatusChart({ className }) {
  const { data: vehiclesData } = useVehicles({ page_size: 200 });
  const vehicles = useMemo(() => {
    return vehiclesData?.results || (Array.isArray(vehiclesData) ? vehiclesData : []);
  }, [vehiclesData]);

  const stats = useMemo(() => {
    const total = vehicles.length || 24; // fallback mockup numbers if empty
    const ready = vehicles.filter((v) => v.status === "ready" || v.status === "active").length || (vehicles.length ? 0 : 18);
    const maintenance = vehicles.filter((v) => v.status === "maintenance").length || (vehicles.length ? 0 : 4);
    const disabled = vehicles.filter((v) => v.status === "out_of_service" || v.status === "disabled").length || (vehicles.length ? 0 : 2);
    const armed = vehicles.filter((v) => v.has_weapon).length || (vehicles.length ? 0 : 14);

    const readyPercent = Math.round((ready / total) * 100) || 75;
    const maintenancePercent = Math.round((maintenance / total) * 100) || 17;
    const disabledPercent = Math.round((disabled / total) * 100) || 8;

    return { total, ready, maintenance, disabled, armed, readyPercent, maintenancePercent, disabledPercent };
  }, [vehicles]);

  return (
    <div className={cn("rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] p-6 lg:p-7 shadow-sm space-y-5", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-white/10 flex items-center justify-center text-[#2B95E8]">
              <Car className="h-4 w-4" />
            </div>
            <h3 className="text-title font-bold text-slate-900 dark:text-white tracking-tight">
              جاهزية أسطول المركبات
            </h3>
          </div>
          <p className="text-caption text-slate-500 dark:text-gray-400">
            مؤشر الحالة الفنية والتسليح التكتيكي للمركبات
          </p>
        </div>

        <div className="px-3 py-1 bg-blue-50 dark:bg-white/5 border border-blue-200/60 dark:border-white/10 rounded-xl text-caption font-bold text-[#2B95E8]">
          إجمالي: {stats.total} مركبة
        </div>
      </div>

      {/* Visual Multi-Segment Progress Bar */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${stats.readyPercent}%` }}
            className="bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer"
            title={`جاهزة: ${stats.readyPercent}%`}
          />
          <div
            style={{ width: `${stats.maintenancePercent}%` }}
            className="bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer"
            title={`صيانة: ${stats.maintenancePercent}%`}
          />
          <div
            style={{ width: `${stats.disabledPercent}%` }}
            className="bg-rose-500 hover:bg-rose-400 transition-all cursor-pointer"
            title={`خارج الخدمة: ${stats.disabledPercent}%`}
          />
        </div>

        <div className="flex items-center justify-between text-caption text-slate-400 font-mono">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-emerald-900 dark:text-emerald-300 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold">جاهزة للعمليات</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-section font-bold font-mono">{stats.ready} <span className="text-caption font-normal font-sans">({stats.readyPercent}%)</span></p>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-amber-900 dark:text-amber-300 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold">تحت الصيانة</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-section font-bold font-mono">{stats.maintenance} <span className="text-caption font-normal font-sans">({stats.maintenancePercent}%)</span></p>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 text-rose-900 dark:text-rose-300 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold">خارج الخدمة</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-section font-bold font-mono">{stats.disabled} <span className="text-caption font-normal font-sans">({stats.disabledPercent}%)</span></p>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 text-blue-900 dark:text-blue-300 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold">مركبات مسلحة</span>
            <Car className="w-4 h-4 text-[#2B95E8]" />
          </div>
          <p className="text-section font-bold font-mono">{stats.armed} <span className="text-caption font-normal font-sans">مركبة</span></p>
        </div>
      </div>
    </div>
  );
}

export default FleetStatusChart;
