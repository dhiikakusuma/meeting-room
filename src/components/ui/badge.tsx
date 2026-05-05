import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "neutral" | "success" | "warning" | "danger" | "info" | "gold";

const variantClasses: Record<Variant, string> = {
  neutral: "bg-ink-50 text-ink-700 border-ink-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  gold: "bg-gold-50 text-gold-700 border-gold-200",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
