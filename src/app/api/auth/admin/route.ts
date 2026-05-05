import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";

const schema = z.object({
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password wajib diisi" }, { status: 400 });
  }
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin?.passwordHash) {
    return NextResponse.json({ error: "Akun admin belum ter-setup. Hubungi super admin." }, { status: 401 });
  }
  const ok = await bcrypt.compare(parsed.data.password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }
  await setSession(admin.id);
  return NextResponse.json({ ok: true, redirect: "/admin" });
}
