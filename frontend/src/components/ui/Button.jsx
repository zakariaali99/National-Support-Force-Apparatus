import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-body-sm font-semibold transition-all duration-150 active:scale-98 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/20 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-fg shadow-xs hover:opacity-95 hover:shadow-sm active:opacity-100",
        primary: "bg-primary text-primary-fg shadow-xs hover:opacity-95 hover:shadow-sm active:opacity-100",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        outline: "border border-slate-300 dark:border-slate-700 bg-surface text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80",
        ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 shadow-none",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-xs active:bg-rose-800",
        danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-xs active:bg-rose-800",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs",
        "soft-blue": "bg-blue-50 text-blue-700 hover:bg-blue-100/90 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 shadow-2xs border border-blue-200/50 dark:border-blue-800/30",
        "soft-emerald": "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/90 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 shadow-2xs border border-emerald-200/50 dark:border-emerald-800/30",
        "soft-rose": "bg-rose-50 text-rose-700 hover:bg-rose-100/90 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 shadow-2xs border border-rose-200/50 dark:border-rose-800/30",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-2.5 text-caption font-medium rounded-md",
        lg: "h-11 px-5 text-body rounded-lg",
        icon: "h-9 w-9 rounded-lg",
        "icon-sm": "h-7.5 w-7.5 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const Button = forwardRef(function Button(
  { className, variant, size, asChild, ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

export { buttonVariants };
