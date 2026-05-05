import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { checkSlotConflict, generateNomorSurat } from "@/lib/booking-rules";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum(["APPROVE", "REJECT"]),
  catatan: z.string().max(500).optional().nullable(),
  adminTtdUrl: z
    .string()
    .startsWith("data:image/")
    .min(100)
    .optional()
    .nullable(),
});

export async function POST(req: Request) {
  const me = await requireRole("admin");
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid" },
      { status: 400 },
    );
  }
  const { ids, action, catatan, adminTtdUrl } = parsed.data;

  if (action === "REJECT" && (!catatan || catatan.trim().length < 3)) {
    return NextResponse.json(
      { error: "Alasan penolakan wajib (min 3 karakter)" },
      { status: 400 },
    );
  }
  if (action === "APPROVE" && !adminTtdUrl) {
    return NextResponse.json(
      { error: "Tanda tangan admin wajib untuk persetujuan massal" },
      { status: 400 },
    );
  }

  const bookings = await prisma.booking.findMany({ where: { id: { in: ids } } });

  const result = {
    success: [] as string[],
    skipped: [] as Array<{ id: string; reason: string }>,
  };

  for (const b of bookings) {
    if (b.status !== "MENUNGGU_ADMIN" && b.status !== "MENUNGGU_ATASAN") {
      result.skipped.push({ id: b.id, reason: `Status sudah ${b.status}` });
      continue;
    }

    if (action === "APPROVE") {
      const conflict = await checkSlotConflict({
        ruanganId: b.ruanganId,
        tanggal: b.tanggal,
        jamMulai: b.jamMulai,
        jamSelesai: b.jamSelesai,
        excludeBookingId: b.id,
      });
      if (conflict.conflict) {
        result.skipped.push({ id: b.id, reason: "Slot bentrok dengan booking lain" });
        continue;
      }

      const now = new Date();
      const nomorSurat = b.nomorSurat ?? (await generateNomorSurat(now));
      await prisma.booking.update({
        where: { id: b.id },
        data: {
          status: "DISETUJUI",
          nomorSurat,
          catatanAdmin: catatan?.trim() || b.catatanAdmin,
          adminId: b.adminId ?? me.id,
          adminNama: b.adminNama ?? me.namaLengkap,
          approvedAdminAt: b.approvedAdminAt ?? now,
          atasanId: me.id,
          atasanNama: me.namaLengkap,
          atasanJabatan: me.jabatan,
          atasanTtdUrl: adminTtdUrl,
          approvedAtasanAt: now,
        },
      });
      await prisma.auditLog.create({
        data: {
          bookingId: b.id,
          userId: me.id,
          actorName: me.namaLengkap,
          actorRole: "admin",
          action: "APPROVE_ADMIN",
          detail: `Bulk approve — ${catatan?.trim() || nomorSurat}`,
        },
      });
      result.success.push(b.id);
    } else {
      await prisma.booking.update({
        where: { id: b.id },
        data: {
          status: "DITOLAK_ADMIN",
          rejectedAt: new Date(),
          catatanAdmin: catatan!.trim(),
          adminId: me.id,
          adminNama: me.namaLengkap,
        },
      });
      await prisma.auditLog.create({
        data: {
          bookingId: b.id,
          userId: me.id,
          actorName: me.namaLengkap,
          actorRole: "admin",
          action: "REJECT_ADMIN",
          detail: `Bulk reject — ${catatan!.trim()}`,
        },
      });
      result.success.push(b.id);
    }
  }

  return NextResponse.json(result);
}
