import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { requireRole, getSessionUser } from "@/lib/auth";
import { checkSlotConflict, validateTimeRange } from "@/lib/booking-rules";
import { isPastDate, parseDateInput } from "@/lib/datetime";

const createSchema = z.object({
  ruanganId: z.string().min(1),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jamMulai: z.string().regex(/^\d{2}:\d{2}$/),
  jamSelesai: z.string().regex(/^\d{2}:\d{2}$/),
  agenda: z.string().min(3, "Catatan agenda wajib diisi minimal 3 karakter").max(500),
  jumlahPeserta: z.number().int().min(1).max(500),
  kebutuhan: z.array(z.string()).default([]),
  pemohonTtdUrl: z
    .string()
    .startsWith("data:image/", "Tanda tangan tidak valid")
    .min(100, "Tanda tangan pemohon wajib diisi"),
  recurring: z
    .object({
      frequency: z.enum(["WEEKLY"]),
      occurrences: z.number().int().min(2).max(52),
    })
    .optional()
    .nullable(),
});

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ items: [] }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const month = url.searchParams.get("month"); // "YYYY-MM"
  const ruanganId = url.searchParams.get("ruanganId");
  const tanggal = url.searchParams.get("tanggal"); // "YYYY-MM-DD"

  const where: Record<string, unknown> = {};

  if (me.role === "pemohon") {
    where.pemohonId = me.id;
  }
  if (status) where.status = status;
  if (ruanganId) where.ruanganId = ruanganId;
  if (tanggal) {
    const start = parseDateInput(tanggal);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.tanggal = { gte: start, lt: end };
  } else if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.tanggal = { gte: start, lt: end };
  }

  const items = await prisma.booking.findMany({
    where,
    orderBy: [{ tanggal: "desc" }, { jamMulai: "asc" }],
    include: {
      ruangan: { select: { nama: true, lantai: true } },
    },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const me = await requireRole("pemohon");
  if (!me) return NextResponse.json({ error: "Hanya pemohon yang bisa submit" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const ruangan = await prisma.ruangan.findUnique({ where: { id: data.ruanganId } });
  if (!ruangan || !ruangan.aktif) {
    return NextResponse.json({ error: "Ruangan tidak tersedia" }, { status: 400 });
  }
  if (data.jumlahPeserta > ruangan.kapasitas) {
    return NextResponse.json(
      { error: `Jumlah peserta melebihi kapasitas ruangan (${ruangan.kapasitas})` },
      { status: 400 },
    );
  }

  const timeError = validateTimeRange(data.jamMulai, data.jamSelesai);
  if (timeError) return NextResponse.json({ error: timeError }, { status: 400 });

  const tanggalAwal = parseDateInput(data.tanggal);
  if (isPastDate(tanggalAwal)) {
    return NextResponse.json({ error: "Tidak bisa booking di tanggal yang sudah lewat" }, { status: 400 });
  }

  // Generate dates list (untuk recurring)
  const dates: Date[] = [tanggalAwal];
  if (data.recurring) {
    for (let i = 1; i < data.recurring.occurrences; i++) {
      const d = new Date(tanggalAwal);
      if (data.recurring.frequency === "WEEKLY") d.setDate(d.getDate() + 7 * i);
      dates.push(d);
    }
  }

  // Cek bentrok untuk semua tanggal
  const conflicts: Array<{ tanggal: string; conflicts: unknown[] }> = [];
  for (const d of dates) {
    const result = await checkSlotConflict({
      ruanganId: data.ruanganId,
      tanggal: d,
      jamMulai: data.jamMulai,
      jamSelesai: data.jamSelesai,
    });
    if (result.conflict) {
      conflicts.push({
        tanggal: d.toISOString().slice(0, 10),
        conflicts: result.conflictingBookings,
      });
    }
  }
  if (conflicts.length > 0) {
    return NextResponse.json(
      {
        error: `Slot bentrok di ${conflicts.length} tanggal (termasuk buffer 15 menit antar acara). Pilih jam lain.`,
        conflicts,
      },
      { status: 409 },
    );
  }

  const bidang = me.bidangId
    ? await prisma.bidang.findUnique({ where: { id: me.bidangId } })
    : null;

  const seriesId = data.recurring ? uuidv4() : null;

  const created = await prisma.$transaction(async (tx) => {
    const list = [];
    for (let i = 0; i < dates.length; i++) {
      const b = await tx.booking.create({
        data: {
          pemohonId: me.id,
          pemohonNama: me.namaLengkap,
          bidangId: bidang?.id,
          bidangNama: bidang?.nama ?? "—",
          ruanganId: ruangan.id,
          ruanganNama: ruangan.nama,
          tanggal: dates[i],
          jamMulai: data.jamMulai,
          jamSelesai: data.jamSelesai,
          agenda: data.agenda.trim(),
          jumlahPeserta: data.jumlahPeserta,
          kebutuhan: data.kebutuhan,
          status: "MENUNGGU_ADMIN",
          pemohonTtdUrl: data.pemohonTtdUrl,
          seriesId: seriesId,
          seriesIndex: data.recurring ? i + 1 : null,
          seriesTotal: data.recurring ? dates.length : null,
          seriesFrequency: data.recurring?.frequency ?? null,
        },
      });
      await tx.auditLog.create({
        data: {
          bookingId: b.id,
          userId: me.id,
          actorName: me.namaLengkap,
          actorRole: "pemohon",
          action: "SUBMIT",
          detail: data.recurring
            ? `Pengajuan ${i + 1}/${dates.length} (rapat berulang ${data.recurring.frequency})`
            : "Pengajuan baru",
        },
      });
      list.push(b);
    }
    return list;
  });

  return NextResponse.json({
    items: created,
    seriesId,
    count: created.length,
  });
}
