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
  const atasan = await prisma.user.findFirst({ where: { role: "atasan" } });
  if (!atasan?.passwordHash) {
    return NextResponse.json({ error: "Akun atasan belum ter-setup. Hubungi admin." }, { status: 401 });
  }
  const ok = await bcrypt.compare(parsed.data.password, atasan.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }
  await setSession(atasan.id);
  return NextResponse.json({ ok: true, redirect: "/atasan" });
}
