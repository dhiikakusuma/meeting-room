import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const schema = z.object({
  ids: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  await prisma.$transaction(
    parsed.data.ids.map((id, i) =>
      prisma.bidang.update({ where: { id }, data: { urutan: i + 1 } }),
    ),
  );
  return NextResponse.json({ ok: true });
}
