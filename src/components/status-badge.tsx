import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/booking-status";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const tone = STATUS_TONES[status] ?? STATUS_TONES.MENUNGGU_ADMIN;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tone.bg,
        tone.border,
        tone.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {label}
    </span>
  );
}
