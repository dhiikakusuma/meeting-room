import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const schema = z.object({
  catatan: z.string().min(3, "Alasan penolakan wajib diisi").max(500),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const me = await requireRole(["admin", "atasan"]);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  if (me.role === "admin" && booking.status !== "MENUNGGU_ADMIN") {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }
  if (me.role === "atasan" && booking.status !== "MENUNGGU_ATASAN") {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const newStatus = me.role === "admin" ? "DITOLAK_ADMIN" : "DITOLAK_ATASAN";
  const data: Record<string, unknown> = {
    status: newStatus,
    rejectedAt: new Date(),
  };
  if (me.role === "admin") {
    data.catatanAdmin = parsed.data.catatan.trim();
    data.adminId = me.id;
    data.adminNama = me.namaLengkap;
  } else {
    data.catatanAtasan = parsed.data.catatan.trim();
    data.atasanId = me.id;
    data.atasanNama = me.namaLengkap;
    data.atasanJabatan = me.jabatan;
  }

  const updated = await prisma.booking.update({ where: { id }, data });
  await prisma.auditLog.create({
    data: {
      bookingId: id,
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: me.role,
      action: me.role === "admin" ? "REJECT_ADMIN" : "REJECT_ATASAN",
      detail: parsed.data.catatan.trim(),
    },
  });

  return NextResponse.json({ booking: updated });
}
