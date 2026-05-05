// Datetime helpers — Asia/Makassar (WITA, UTC+8) for DP3AKB Balikpapan.

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const HARI_LONG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_LONG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export const OPEN_HOUR = 8; // 08:00
export const CLOSE_HOUR = 17; // 17:00
export const SLOT_MIN = 30; // 30 menit per slot
export const BUFFER_MIN = 15; // 15 menit buffer cleanup antar booking

export function formatTanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTanggalLong(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${HARI_LONG[date.getDay()]}, ${date.getDate()} ${BULAN_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateInput(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function parseDateInput(s: string): Date {
  // s is "YYYY-MM-DD"
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "HH:mm" -> minutes since midnight */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight -> "HH:mm" */
export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Cek dua interval waktu overlap (dengan buffer). */
export function isOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
  bufferMinutes: number = 0,
): boolean {
  const as = timeToMinutes(aStart);
  const ae = timeToMinutes(aEnd) + bufferMinutes;
  const bs = timeToMinutes(bStart) - bufferMinutes;
  const be = timeToMinutes(bEnd);
  return as < be && bs < ae;
}

/** Generate slot timeline tiap 30 menit dari OPEN_HOUR sampai CLOSE_HOUR. */
export function generateSlots(): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MIN) {
      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const endMin = h * 60 + m + SLOT_MIN;
      const eh = Math.floor(endMin / 60);
      const em = endMin % 60;
      const end = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
      slots.push({ start, end });
    }
  }
  return slots;
}

/** Tanggal awal hari ini (00:00 lokal). */
export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Periksa apakah tanggal di masa lalu (sebelum hari ini). */
export function isPastDate(d: Date | string): boolean {
  const date = typeof d === "string" ? new Date(d) : d;
  const today = todayStart();
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

export function durationLabel(start: string, end: string): string {
  const mins = timeToMinutes(end) - timeToMinutes(start);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} menit`;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} menit`;
}
