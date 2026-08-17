import { useEffect, useState } from "react";
import { Skeleton } from "./Skeleton";
import { cn } from "../../lib/utils";
import { formatNumber } from "../../lib/format";
import { countUp } from "../../lib/motion";

const TONE_MAP = {
  primary: "bg-blue-50 text-[#2B95E8] dark:bg-white/10 dark:text-white",
  default: "bg-blue-50 text-[#2B95E8] dark:bg-white/10 dark:text-white",
  blue: "bg-blue-50 text-[#2B95E8] dark:bg-white/10 dark:text-white",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
  gold: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
  neutral: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
};

function AnimatedValue({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const tween = countUp(value, setDisplay);
    return () => {
      if (tween) tween.kill();
    };
  }, [value]);

  return <>{formatNumber(display)}</>;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  variant = "default",
  loading = false,
  pulse = false,
  className,
}) {
  const isNavy = variant === "navy";
  const isGradient = variant === "gradient";

  if (isNavy) {
    return (
      <div
        className={cn(
          "bg-[#1A2038] text-white rounded-[28px] p-6 lg:p-7 relative overflow-hidden shadow-xl group transition-all duration-300 hover:-translate-y-1",
          className
        )}
      >
        <div className="flex items-start justify-between relative z-10 mb-4">
          <p className="text-gray-400 font-medium text-body-sm">{title}</p>
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-[#1A2038] transition-colors shadow-md">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="relative z-10">
          {loading ? (
            <Skeleton className="h-10 w-24 bg-white/10" />
          ) : (
            <h3 className="text-display font-bold tracking-tight text-white mb-1">
              <AnimatedValue value={value} />
            </h3>
          )}
          {subtitle && <p className="text-gray-400 text-caption mt-1">{subtitle}</p>}
        </div>
        {/* Niqabaty cyan blur blob */}
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#2B95E8] opacity-25 rounded-full blur-3xl pointer-events-none" />
      </div>
    );
  }

  if (isGradient) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-[#5468D4] to-[#4353AA] text-white rounded-[28px] p-6 lg:p-7 relative overflow-hidden shadow-lg group transition-all duration-300 hover:-translate-y-1",
          className
        )}
      >
        <div className="flex items-start justify-between relative z-10 mb-4">
          <p className="text-blue-100 font-medium text-body-sm">{title}</p>
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-[#5468D4] transition-colors shadow-md">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="relative z-10">
          {loading ? (
            <Skeleton className="h-10 w-24 bg-white/20" />
          ) : (
            <h3 className="text-display font-bold tracking-tight text-white mb-1">
              <AnimatedValue value={value} />
            </h3>
          )}
          {subtitle && <p className="text-blue-200 text-caption mt-1 opacity-90">{subtitle}</p>}
        </div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white opacity-15 rounded-full blur-3xl pointer-events-none" />
      </div>
    );
  }

  const activeTone = tone || (variant !== "default" ? variant : "primary");

  return (
    <div
      className={cn(
        "rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] text-foreground shadow-sm p-6 lg:p-7 flex items-start justify-between gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      <div className="space-y-2 min-w-0 flex-1">
        <p className="text-caption font-medium text-slate-500 dark:text-gray-400">{title}</p>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-display font-bold tracking-tight text-slate-900 dark:text-white">
              <AnimatedValue value={value} />
            </h3>
            {pulse && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
              </span>
            )}
          </div>
        )}
        {subtitle && <p className="text-caption text-slate-400 dark:text-gray-500">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={cn("w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-xs transition-colors", TONE_MAP[activeTone] || TONE_MAP.primary)}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}