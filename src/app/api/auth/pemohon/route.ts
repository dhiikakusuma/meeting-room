import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";

const schema = z.object({
  namaLengkap: z.string().min(2, "Nama minimal 2 karakter").max(100).trim(),
  bidangId: z.string().min(1, "Pilih bidang"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }
  const { namaLengkap, bidangId } = parsed.data;

  const bidang = await prisma.bidang.findFirst({
    where: { id: bidangId, aktif: true },
  });
  if (!bidang) {
    return NextResponse.json({ error: "Bidang tidak ditemukan / nonaktif" }, { status: 400 });
  }

  // Cari user pemohon berdasarkan nama (case-insensitive) dan bidang yang sama.
  // Kalau tidak ada, buat baru.
  const existing = await prisma.user.findFirst({
    where: {
      role: "pemohon",
      namaLengkap: { equals: namaLengkap, mode: "insensitive" },
      bidangId: bidang.id,
    },
  });

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        namaLengkap,
        role: "pemohon",
        bidangId: bidang.id,
      },
    }));

  await setSession(user.id);
  return NextResponse.json({ ok: true, redirect: "/pemohon" });
}
