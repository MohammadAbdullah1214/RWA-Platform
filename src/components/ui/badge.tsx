import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground shadow-sm":
            variant === "default",
          "border-transparent bg-secondary text-secondary-foreground":
            variant === "secondary",
          "border-transparent bg-destructive text-destructive-foreground":
            variant === "destructive",
          "border-transparent bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25":
            variant === "success",
          "border-slate-200/70 bg-white/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900":
            variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
