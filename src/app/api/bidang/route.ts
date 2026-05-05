import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const onlyActive = url.searchParams.get("aktif") === "1";
  const items = await prisma.bidang.findMany({
    where: onlyActive ? { aktif: true } : undefined,
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    select: {
      id: true,
      nama: true,
      kode: true,
      aktif: true,
      urutan: true,
      _count: { select: { users: true } },
    },
  });
  return NextResponse.json({ items });
}

const createSchema = z.object({
  nama: z.string().min(2).max(120),
  kode: z.string().max(16).optional().nullable(),
});

export async function POST(req: Request) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }

  const max = await prisma.bidang.aggregate({ _max: { urutan: true } });
  const created = await prisma.bidang.create({
    data: {
      nama: parsed.data.nama.trim(),
      kode: parsed.data.kode?.trim() || null,
      urutan: (max._max.urutan ?? 0) + 1,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: me.id,
      actorName: me.namaLengkap,
      actorRole: me.role,
      action: "CREATE_BIDANG",
      detail: created.nama,
    },
  });

  return NextResponse.json({ item: created });
}
