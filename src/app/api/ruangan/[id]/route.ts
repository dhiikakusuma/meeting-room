import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const updateSchema = z.object({
  nama: z.string().min(2).max(120).optional(),
  lantai: z.string().max(60).optional().nullable(),
  kapasitas: z.number().int().min(1).max(500).optional(),
  fasilitas: z.array(z.string()).optional(),
  fotoUrl: z.string().optional().nullable(),
  aktif: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const updated = await prisma.ruangan.update({ where: { id }, data: parsed.data });
  await prisma.auditLog.create({
    data: {
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: me.role,
      action: "UPDATE_RUANGAN",
      detail: updated.nama,
    },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const ruangan = await prisma.ruangan.findUnique({
    where: { id },
    include: { _count: { select: { bookings: true } } },
  });
  if (!ruangan) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  if (ruangan._count.bookings > 0) {
    const updated = await prisma.ruangan.update({
      where: { id },
      data: { aktif: false },
    });
    await prisma.auditLog.create({
      data: {
        userId: me.id,
        actorName: me.namaLengkap,
        actorRole: me.role,
        action: "DEACTIVATE_RUANGAN",
        detail: `${updated.nama} (terkait ${ruangan._count.bookings} booking)`,
      },
    });
    return NextResponse.json({
      item: updated,
      softDeleted: true,
      message: "Ruangan dinonaktifkan (sudah memiliki riwayat booking).",
    });
  }
  await prisma.ruangan.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: me.role,
      action: "DELETE_RUANGAN",
      detail: ruangan.nama,
    },
  });
  return NextResponse.json({ ok: true });
}
