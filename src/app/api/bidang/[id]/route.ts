import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const updateSchema = z.object({
  nama: z.string().min(2).max(120).optional(),
  kode: z.string().max(16).optional().nullable(),
  aktif: z.boolean().optional(),
  urutan: z.number().int().optional(),
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
  const updated = await prisma.bidang.update({
    where: { id },
    data: parsed.data,
  });
  await prisma.auditLog.create({
    data: {
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: me.role,
      action: "UPDATE_BIDANG",
      detail: updated.nama,
    },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const bidang = await prisma.bidang.findUnique({
    where: { id },
    include: { _count: { select: { users: true, bookings: true } } },
  });
  if (!bidang) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  if (bidang._count.users > 0 || bidang._count.bookings > 0) {
    // Soft delete: set non-aktif (data historis tetap aman)
    const updated = await prisma.bidang.update({
      where: { id },
      data: { aktif: false },
    });
    await prisma.auditLog.create({
      data: {
        userId: me.id,
        actorName: me.namaLengkap,
        actorRole: me.role,
        action: "DEACTIVATE_BIDANG",
        detail: `${updated.nama} (terkait ${bidang._count.users} user, ${bidang._count.bookings} booking)`,
      },
    });
    return NextResponse.json({
      item: updated,
      softDeleted: true,
      message: "Bidang dinonaktifkan (masih terkait dengan data historis).",
    });
  }

  await prisma.bidang.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: me.role,
      action: "DELETE_BIDANG",
      detail: bidang.nama,
    },
  });
  return NextResponse.json({ ok: true });
}
