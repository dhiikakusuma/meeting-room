import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      ruangan: true,
      bidang: true,
      auditLogs: { orderBy: { timestamp: "desc" } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  // Pemohon hanya bisa lihat booking sendiri
  if (me.role === "pemohon" && booking.pemohonId !== me.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ booking });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  // Cancel hanya boleh dilakukan oleh pemohon yang mengajukan booking-nya sendiri.
  if (me.role !== "pemohon") {
    return NextResponse.json(
      { error: "Hanya pemohon yang dapat membatalkan booking. Admin/Atasan dapat menolak melalui aksi reject." },
      { status: 403 },
    );
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  if (booking.pemohonId !== me.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cancelable = ["MENUNGGU_ADMIN", "MENUNGGU_ATASAN"];
  if (!cancelable.includes(booking.status)) {
    return NextResponse.json(
      { error: "Tidak bisa membatalkan booking yang sudah disetujui/ditolak" },
      { status: 400 },
    );
  }

  await prisma.booking.update({
    where: { id },
    data: {
      status: "BATAL_PEMOHON",
      cancelledAt: new Date(),
    },
  });
  await prisma.auditLog.create({
    data: {
      bookingId: id,
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: me.role,
      action: "CANCEL",
      detail: "Dibatalkan oleh pemohon",
    },
  });
  return NextResponse.json({ ok: true });
}
