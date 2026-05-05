import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
  variant = "ink",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "ink" | "cream";
}) {
  const sizeMap = {
    sm: "h-9 w-9 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-xl",
  };
  const variantMap = {
    ink: "border-gold-300/60 bg-ink-900 text-gold-300",
    cream: "border-gold-300/60 bg-cream-50 text-gold-700",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border-[1.5px] font-serif font-semibold tracking-wide",
        sizeMap[size],
        variantMap[variant],
        className,
      )}
      aria-hidden="true"
    >
      D
    </div>
  );
}
