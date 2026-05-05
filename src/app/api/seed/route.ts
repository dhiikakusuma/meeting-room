import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DEFAULT_BIDANG = [
  { nama: "Sub Bagian Umum & Kepegawaian", kode: "SBU", urutan: 1 },
  { nama: "Bidang Pemberdayaan Perempuan", kode: "PP", urutan: 2 },
  { nama: "Bidang Perlindungan Anak", kode: "PA", urutan: 3 },
  { nama: "Bidang Keluarga Berencana", kode: "KB", urutan: 4 },
  { nama: "Bidang Pengarusutamaan Gender", kode: "PUG", urutan: 5 },
];

const DEFAULT_RUANGAN = [
  {
    nama: "Ruang Rapat Utama",
    lantai: "Lantai 2",
    kapasitas: 25,
    fasilitas: ["Proyektor", "AC", "Whiteboard", "Sound System", "WiFi"],
    fotoUrl: "/dp3akb-room.jpg",
    urutan: 1,
  },
];

export async function GET() {
  return runSeed();
}

export async function POST() {
  return runSeed();
}

async function runSeed() {
  const created: Record<string, number> = {};

  // Seed bidang
  for (const b of DEFAULT_BIDANG) {
    const existing = await prisma.bidang.findFirst({ where: { nama: b.nama } });
    if (!existing) {
      await prisma.bidang.create({ data: b });
      created.bidang = (created.bidang ?? 0) + 1;
    }
  }

  // Seed ruangan
  for (const r of DEFAULT_RUANGAN) {
    const existing = await prisma.ruangan.findFirst({ where: { nama: r.nama } });
    if (!existing) {
      await prisma.ruangan.create({ data: r });
      created.ruangan = (created.ruangan ?? 0) + 1;
    }
  }

  // Seed admin
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin) {
    await prisma.user.create({
      data: {
        namaLengkap: "Admin Ruang Rapat",
        jabatan: "STAFF UMUM",
        role: "admin",
        passwordHash: await bcrypt.hash("admin123", 10),
      },
    });
    created.admin = 1;
  }

  // Seed atasan
  const atasan = await prisma.user.findFirst({ where: { role: "atasan" } });
  if (!atasan) {
    await prisma.user.create({
      data: {
        namaLengkap: "Kepala Dinas DP3AKB",
        jabatan: "KEPALA DINAS",
        role: "atasan",
        passwordHash: await bcrypt.hash("atasan123", 10),
      },
    });
    created.atasan = 1;
  }

  return NextResponse.json({
    ok: true,
    created,
    info: {
      admin: { password: "admin123", login: "/login/admin" },
      atasan: { password: "atasan123", login: "/login/atasan" },
    },
  });
}
