import { prisma } from "./prisma";
import { isOverlap, BUFFER_MIN, timeToMinutes, OPEN_HOUR, CLOSE_HOUR } from "./datetime";

export { STATUS_LABELS, STATUS_TONES } from "./booking-status";

export const LOCKING_STATUSES = ["MENUNGGU_ATASAN", "DISETUJUI"] as const;
export const ACTIVE_STATUSES = ["MENUNGGU_ADMIN", "MENUNGGU_ATASAN", "DISETUJUI"] as const;

export type ConflictResult = {
  conflict: boolean;
  conflictingBookings: Array<{
    id: string;
    pemohonNama: string;
    bidangNama: string;
    jamMulai: string;
    jamSelesai: string;
    status: string;
  }>;
};

/**
 * Cek apakah slot bentrok dengan booking yang sudah locked
 * (status MENUNGGU_ATASAN atau DISETUJUI). Buffer 15 menit antar acara.
 */
export async function checkSlotConflict({
  ruanganId,
  tanggal,
  jamMulai,
  jamSelesai,
  excludeBookingId,
  withBuffer = true,
}: {
  ruanganId: string;
  tanggal: Date;
  jamMulai: string;
  jamSelesai: string;
  excludeBookingId?: string;
  withBuffer?: boolean;
}): Promise<ConflictResult> {
  const startOfDay = new Date(tanggal);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const candidates = await prisma.booking.findMany({
    where: {
      ruanganId,
      tanggal: { gte: startOfDay, lt: endOfDay },
      status: { in: [...LOCKING_STATUSES] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: {
      id: true,
      pemohonNama: true,
      bidangNama: true,
      jamMulai: true,
      jamSelesai: true,
      status: true,
    },
  });

  const buffer = withBuffer ? BUFFER_MIN : 0;
  const conflicting = candidates.filter((b) =>
    isOverlap(jamMulai, jamSelesai, b.jamMulai, b.jamSelesai, buffer),
  );

  return {
    conflict: conflicting.length > 0,
    conflictingBookings: conflicting,
  };
}

export function validateTimeRange(jamMulai: string, jamSelesai: string): string | null {
  const start = timeToMinutes(jamMulai);
  const end = timeToMinutes(jamSelesai);
  const open = OPEN_HOUR * 60;
  const close = CLOSE_HOUR * 60;

  if (start < open || start >= close) {
    return `Jam mulai harus antara ${String(OPEN_HOUR).padStart(2, "0")}:00 — ${String(CLOSE_HOUR).padStart(2, "0")}:00`;
  }
  if (end <= open || end > close) {
    return `Jam selesai harus antara ${String(OPEN_HOUR).padStart(2, "0")}:00 — ${String(CLOSE_HOUR).padStart(2, "0")}:00`;
  }
  if (end <= start) {
    return "Jam selesai harus setelah jam mulai";
  }
  if (end - start < 30) {
    return "Durasi minimal 30 menit";
  }
  return null;
}

/**
 * Generate nomor surat: 001/RR-DP3AKB/V/2026
 * Format: <counter 3 digit>/RR-DP3AKB/<bulan romawi>/<tahun>
 */
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export async function generateNomorSurat(date: Date = new Date()): Promise<string> {
  const tahun = date.getFullYear();
  const bulan = date.getMonth() + 1;

  const counter = await prisma.nomorSuratCounter.upsert({
    where: { tahun_bulan: { tahun, bulan } },
    create: { tahun, bulan, counter: 1 },
    update: { counter: { increment: 1 } },
  });

  const padded = String(counter.counter).padStart(3, "0");
  return `${padded}/RR-DP3AKB/${ROMAN[bulan]}/${tahun}`;
}


