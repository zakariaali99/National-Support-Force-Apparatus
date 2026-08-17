import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-body-sm font-medium transition-all duration-200 active:scale-98 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#2B95E8]/30 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#2B95E8] text-white shadow-md hover:bg-[#2382cc] active:bg-[#1f72b3]",
        primary: "bg-[#2B95E8] text-white shadow-md hover:bg-[#2382cc] active:bg-[#1f72b3]",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
        outline: "border border-slate-200/80 bg-white text-slate-800 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:text-white shadow-2xs",
        ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 shadow-none",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-md active:bg-rose-800",
        danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-md active:bg-rose-800",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md",
        "soft-blue": "bg-blue-50 text-[#2B95E8] hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 shadow-2xs border border-blue-200/60 dark:border-blue-800/40",
        "soft-emerald": "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/40",
        "soft-rose": "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 shadow-2xs border border-rose-200/60 dark:border-rose-800/40",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-8.5 px-3.5 text-caption font-medium rounded-xl",
        lg: "h-12 px-7 text-body rounded-2xl",
        icon: "h-10 w-10 rounded-2xl",
        "icon-sm": "h-8 w-8 rounded-xl",
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
