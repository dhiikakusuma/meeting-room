import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatTanggal } from "@/lib/datetime";
import { STATUS_LABELS } from "@/lib/booking-rules";

export async function GET(req: Request) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // YYYY-MM
  const status = url.searchParams.get("status");
  const bidangId = url.searchParams.get("bidangId");
  const ruanganId = url.searchParams.get("ruanganId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (bidangId) where.bidangId = bidangId;
  if (ruanganId) where.ruanganId = ruanganId;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.tanggal = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: [{ tanggal: "asc" }, { jamMulai: "asc" }],
  });

  const rows = bookings.map((b, i) => ({
    No: i + 1,
    "Nomor Surat": b.nomorSurat ?? "—",
    Tanggal: formatTanggal(b.tanggal),
    "Jam Mulai": b.jamMulai,
    "Jam Selesai": b.jamSelesai,
    Ruangan: b.ruanganNama,
    Pemohon: b.pemohonNama,
    Bidang: b.bidangNama,
    Agenda: b.agenda,
    Peserta: b.jumlahPeserta,
    Status: STATUS_LABELS[b.status] ?? b.status,
    "Catatan Admin": b.catatanAdmin ?? "",
    "Catatan Atasan": b.catatanAtasan ?? "",
    "Disetujui Admin": b.adminNama ?? "—",
    "Disetujui Atasan": b.atasanNama ?? "—",
    Submit: b.createdAt.toISOString().slice(0, 16).replace("T", " "),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  // Set column widths
  ws["!cols"] = [
    { wch: 4 },
    { wch: 24 },
    { wch: 18 },
    { wch: 8 },
    { wch: 8 },
    { wch: 22 },
    { wch: 22 },
    { wch: 28 },
    { wch: 36 },
    { wch: 8 },
    { wch: 16 },
    { wch: 30 },
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Booking");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `laporan-booking${month ? `-${month}` : ""}.xlsx`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
