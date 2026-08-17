import { cn } from "../../lib/utils";

export function Badge({ className, variant = "default", pulse = false, children, ...props }) {
  const variants = {
    default: "bg-[#2B95E8] text-white shadow-xs",
    primary: "bg-blue-50 text-[#2B95E8] dark:bg-blue-950/60 dark:text-blue-300",
    secondary: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
    outline: "bg-slate-50/80 text-slate-700 border border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10",
    neutral: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    subtle: "bg-slate-50 text-slate-600 border border-slate-200/60 dark:bg-white/5 dark:text-slate-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    destructive: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    info: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
    gold: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-0.5 text-caption font-semibold select-none transition-all duration-150",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );
}
