import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { checkSlotConflict } from "@/lib/booking-rules";

const schema = z.object({
  catatan: z.string().max(500).optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  if (booking.status !== "MENUNGGU_ADMIN") {
    return NextResponse.json({ error: "Status tidak valid untuk persetujuan admin" }, { status: 400 });
  }

  // Race-condition guard: cek bentrok sekali lagi sebelum lock
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
        error: "Slot ini sudah terkunci oleh booking lain. Silakan pilih booking lain atau koordinasikan ulang.",
        conflicts: conflict.conflictingBookings,
      },
      { status: 409 },
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: "MENUNGGU_ATASAN",
      catatanAdmin: parsed.data.catatan?.trim() || null,
      adminId: me.id,
      adminNama: me.namaLengkap,
      approvedAdminAt: new Date(),
    },
  });
  await prisma.auditLog.create({
    data: {
      bookingId: id,
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: "admin",
      action: "APPROVE_ADMIN",
      detail: parsed.data.catatan?.trim() || "Disetujui admin",
    },
  });

  return NextResponse.json({ booking: updated });
}
