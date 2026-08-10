import { cn } from "../../lib/utils";

export function Badge({ className, variant = "default", pulse = false, children, ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground shadow-xs",
    secondary: "bg-secondary/90 text-secondary-foreground border border-border/80",
    outline: "border border-border text-foreground bg-background/50 backdrop-blur-sm",
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    destructive: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
    info: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold select-none transition-all duration-150",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );
}
