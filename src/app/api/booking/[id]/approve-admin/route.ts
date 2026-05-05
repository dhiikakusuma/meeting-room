import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { checkSlotConflict, generateNomorSurat } from "@/lib/booking-rules";

const schema = z.object({
  catatan: z.string().max(500).optional().nullable(),
  adminTtdUrl: z
    .string()
    .startsWith("data:image/", "Tanda tangan tidak valid")
    .min(100, "Tanda tangan admin wajib diisi"),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  // Admin kini menjadi approver final. Status MENUNGGU_ATASAN tetap bisa
  // diselesaikan oleh admin (untuk booking lama yang sudah lewat tahap admin
  // tapi belum keluar surat resminya).
  if (booking.status !== "MENUNGGU_ADMIN" && booking.status !== "MENUNGGU_ATASAN") {
    return NextResponse.json(
      { error: "Status tidak valid untuk persetujuan" },
      { status: 400 },
    );
  }

  // Race-condition guard: cek bentrok sekali lagi sebelum lock.
  const conflict = await checkSlotConflict({
    ruanganId: booking.ruanganId,
    tanggal: booking.tanggal,
    jamMulai: booking.jamMulai,
    jamSelesai: booking.jamSelesai,
    excludeBookingId: booking.id,
  });
  if (conflict.conflict) {
    return NextResponse.json(
      {
        error:
          "Slot ini sudah terkunci oleh booking lain. Silakan pilih booking lain atau koordinasikan ulang.",
        conflicts: conflict.conflictingBookings,
      },
      { status: 409 },
    );
  }

  const now = new Date();
  const nomorSurat = booking.nomorSurat ?? (await generateNomorSurat(now));

  // Field "atasan*" di-reuse untuk menyimpan data persetujuan akhir oleh
  // admin. Ini menghindari migrasi DB tambahan; secara semantik sekarang
  // mereka berarti "approver final".
  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: "DISETUJUI",
      nomorSurat,
      catatanAdmin: parsed.data.catatan?.trim() || booking.catatanAdmin,
      adminId: booking.adminId ?? me.id,
      adminNama: booking.adminNama ?? me.namaLengkap,
      approvedAdminAt: booking.approvedAdminAt ?? now,
      atasanId: me.id,
      atasanNama: me.namaLengkap,
      atasanJabatan: me.jabatan,
      atasanTtdUrl: parsed.data.adminTtdUrl,
      approvedAtasanAt: now,
    },
  });
  await prisma.auditLog.create({
    data: {
      bookingId: id,
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: "admin",
      action: "APPROVE_ADMIN",
      detail: parsed.data.catatan?.trim() || `Disetujui — ${nomorSurat}`,
    },
  });

  return NextResponse.json({ booking: updated });
}
