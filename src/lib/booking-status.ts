// Client-safe constants for booking status (no Prisma imports).

export const STATUS_LABELS: Record<string, string> = {
  MENUNGGU_ADMIN: "Menunggu Admin",
  MENUNGGU_ATASAN: "Menunggu Atasan",
  DISETUJUI: "Disetujui",
  DITOLAK_ADMIN: "Ditolak Admin",
  DITOLAK_ATASAN: "Ditolak Atasan",
  BATAL_PEMOHON: "Dibatalkan",
};

export const STATUS_TONES: Record<
  string,
  { bg: string; border: string; text: string; dot: string }
> = {
  MENUNGGU_ADMIN: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  MENUNGGU_ATASAN: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  DISETUJUI: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  DITOLAK_ADMIN: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  DITOLAK_ATASAN: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  BATAL_PEMOHON: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-500",
  },
};
