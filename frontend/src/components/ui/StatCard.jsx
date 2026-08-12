import { useEffect, useState } from "react";

import { Skeleton } from "./Skeleton";
import { cn } from "../../lib/utils";
import { formatNumber } from "../../lib/format";
import { countUp } from "../../lib/motion";

const TONE_MAP = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-accent/10 text-accent-text",
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

/** KPI card used by the dashboard. Replaces DashboardPage's inline markup and
 *  its per-card `color: "text-blue-600 bg-blue-500/10"` strings.
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  tone = "primary",
  loading = false,
  pulse = false,
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface text-fg shadow-raised p-5 flex items-center justify-between gap-3",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-label font-semibold text-fg-subtle">{title}</p>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-title font-bold tracking-tight text-fg">
              <AnimatedValue value={value} />
            </h2>
            {pulse && (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
              </span>
            )}
          </div>
        )}
      </div>
      {Icon && (
        <div className={cn("p-3 rounded-xl shrink-0", TONE_MAP[tone] || TONE_MAP.primary)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}