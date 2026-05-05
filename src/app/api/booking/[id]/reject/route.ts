import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const schema = z.object({
  catatan: z.string().min(3, "Alasan penolakan wajib diisi").max(500),
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
      { error: parsed.error.issues[0]?.message ?? "Invalid" },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  // Admin sebagai approver final bisa menolak booking selama belum disetujui /
  // ditolak / dibatalkan.
  if (booking.status !== "MENUNGGU_ADMIN" && booking.status !== "MENUNGGU_ATASAN") {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: "DITOLAK_ADMIN",
      rejectedAt: new Date(),
      catatanAdmin: parsed.data.catatan.trim(),
      adminId: me.id,
      adminNama: me.namaLengkap,
    },
  });
  await prisma.auditLog.create({
    data: {
      bookingId: id,
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: "admin",
      action: "REJECT_ADMIN",
      detail: parsed.data.catatan.trim(),
    },
  });

  return NextResponse.json({ booking: updated });
}
