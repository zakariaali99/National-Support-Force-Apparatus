import { useEffect, useState } from "react";
import { Skeleton } from "./Skeleton";
import { cn } from "../../lib/utils";
import { formatNumber } from "../../lib/format";
import { countUp } from "../../lib/motion";

const TONE_MAP = {
  primary: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-4 ring-blue-500/10",
  default: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-4 ring-blue-500/10",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-4 ring-blue-500/10",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-4 ring-emerald-500/10",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-4 ring-amber-500/10",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-4 ring-rose-500/10",
  gold: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-4 ring-amber-500/10",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 ring-4 ring-sky-500/10",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-4 ring-slate-500/10",
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
  icon: Icon,
  tone,
  variant,
  loading = false,
  pulse = false,
  className,
}) {
  const activeTone = tone || variant || "primary";

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 dark:border-slate-800 bg-surface text-fg shadow-xs p-4 sm:p-5 flex items-center justify-between gap-3 transition-all duration-200 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-caption font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-title font-bold tracking-tight text-slate-900 dark:text-slate-100">
              <AnimatedValue value={value} />
            </h2>
            {pulse && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
              </span>
            )}
          </div>
        )}
      </div>
      {Icon && (
        <div className={cn("p-2.5 sm:p-3 rounded-full shrink-0 flex items-center justify-center", TONE_MAP[activeTone] || TONE_MAP.primary)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}