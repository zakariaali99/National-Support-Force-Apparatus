import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1A2038] text-foreground shadow-sm transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-6 lg:p-7", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn("text-title font-bold text-slate-900 dark:text-white tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-caption text-slate-500 dark:text-gray-400", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6 lg:p-7 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-6 lg:p-7 pt-0 border-t border-slate-100 dark:border-white/10 mt-4", className)} {...props} />;
}
