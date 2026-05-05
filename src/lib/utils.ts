import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTanggal(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTanggalPendek(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function terbilangStatus(
  status: string,
): { label: string; tone: "warning" | "success" | "danger" | "neutral" } {
  switch (status) {
    case "menunggu":
      return { label: "Menunggu Persetujuan", tone: "warning" };
    case "disetujui":
      return { label: "Disetujui", tone: "success" };
    case "ditolak":
      return { label: "Ditolak", tone: "danger" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export function generateNomorSurat(urutan: number, tahun: number) {
  const padded = String(urutan).padStart(3, "0");
  // Matches example letter format: "029/_____/DP3AKB-SKT"
  return `${padded}/${tahun}/DP3AKB-SKT`;
}
