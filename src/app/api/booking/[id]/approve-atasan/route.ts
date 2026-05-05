import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { generateNomorSurat } from "@/lib/booking-rules";

const schema = z.object({
  catatan: z.string().max(500).optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const me = await requireRole("atasan");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  if (booking.status !== "MENUNGGU_ATASAN") {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const nomorSurat = booking.nomorSurat ?? (await generateNomorSurat(new Date()));

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: "DISETUJUI",
      nomorSurat,
      catatanAtasan: parsed.data.catatan?.trim() || null,
      atasanId: me.id,
      atasanNama: me.namaLengkap,
      atasanJabatan: me.jabatan,
      approvedAtasanAt: new Date(),
    },
  });
  await prisma.auditLog.create({
    data: {
      bookingId: id,
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: "atasan",
      action: "APPROVE_ATASAN",
      detail: parsed.data.catatan?.trim() || `Disetujui — ${nomorSurat}`,
    },
  });

  return NextResponse.json({ booking: updated });
}
