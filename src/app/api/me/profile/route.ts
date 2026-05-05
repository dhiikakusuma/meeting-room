import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const patchSchema = z.object({
  namaLengkap: z.string().trim().min(2, "Nama wajib diisi minimal 2 karakter").max(120),
  jabatan: z.string().trim().max(120).optional().nullable(),
});

export async function PATCH(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // For now we only allow atasan to edit their own profile here. Admin and pemohon
  // edit flows can be added later if needed.
  if (me.role !== "atasan") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: {
      namaLengkap: parsed.data.namaLengkap,
      jabatan: parsed.data.jabatan ?? null,
    },
    select: {
      id: true,
      namaLengkap: true,
      jabatan: true,
      role: true,
    },
  });

  return NextResponse.json({ user: updated });
}
