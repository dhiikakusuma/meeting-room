import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold-200 bg-gold-50 text-gold-700">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="serif text-base font-semibold text-ink-900 mt-4">{title}</p>
      {description && (
        <p className="text-xs text-ink-500 mt-1.5 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
