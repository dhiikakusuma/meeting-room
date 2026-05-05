import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const onlyActive = url.searchParams.get("aktif") === "1";
  const items = await prisma.ruangan.findMany({
    where: onlyActive ? { aktif: true } : undefined,
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
  });
  return NextResponse.json({ items });
}

const createSchema = z.object({
  nama: z.string().min(2).max(120),
  lantai: z.string().max(60).optional().nullable(),
  kapasitas: z.number().int().min(1).max(500),
  fasilitas: z.array(z.string()).default([]),
  fotoUrl: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }

  const max = await prisma.ruangan.aggregate({ _max: { urutan: true } });
  const created = await prisma.ruangan.create({
    data: {
      nama: parsed.data.nama.trim(),
      lantai: parsed.data.lantai?.trim() || null,
      kapasitas: parsed.data.kapasitas,
      fasilitas: parsed.data.fasilitas,
      fotoUrl: parsed.data.fotoUrl || "/dp3akb-room.jpg",
      urutan: (max._max.urutan ?? 0) + 1,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: me.role,
      action: "CREATE_RUANGAN",
      detail: created.nama,
    },
  });

  return NextResponse.json({ item: created });
}
