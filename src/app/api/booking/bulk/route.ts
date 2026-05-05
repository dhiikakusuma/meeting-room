import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { checkSlotConflict, generateNomorSurat } from "@/lib/booking-rules";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum(["APPROVE", "REJECT"]),
  catatan: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  const me = await requireRole(["admin", "atasan"]);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const { ids, action, catatan } = parsed.data;

  if (action === "REJECT" && (!catatan || catatan.trim().length < 3)) {
    return NextResponse.json({ error: "Alasan penolakan wajib (min 3 karakter)" }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({ where: { id: { in: ids } } });

  const result = {
    success: [] as string[],
    skipped: [] as Array<{ id: string; reason: string }>,
  };

  for (const b of bookings) {
    const expectedStatus = me.role === "admin" ? "MENUNGGU_ADMIN" : "MENUNGGU_ATASAN";
    if (b.status !== expectedStatus) {
      result.skipped.push({ id: b.id, reason: `Status sudah ${b.status}` });
      continue;
    }

    if (action === "APPROVE") {
      // Cek konflik slot
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

      const data: Record<string, unknown> = {};
      if (me.role === "admin") {
        data.status = "MENUNGGU_ATASAN";
        data.catatanAdmin = catatan?.trim() || null;
        data.adminId = me.id;
        data.adminNama = me.namaLengkap;
        data.approvedAdminAt = new Date();
      } else {
        const nomorSurat = b.nomorSurat ?? (await generateNomorSurat(new Date()));
        data.status = "DISETUJUI";
        data.nomorSurat = nomorSurat;
        data.catatanAtasan = catatan?.trim() || null;
        data.atasanId = me.id;
        data.atasanNama = me.namaLengkap;
        data.atasanJabatan = me.jabatan;
        data.approvedAtasanAt = new Date();
      }
      await prisma.booking.update({ where: { id: b.id }, data });
      await prisma.auditLog.create({
        data: {
          bookingId: b.id,
          userId: me.id,
          actorName: me.namaLengkap,
          actorRole: me.role,
          action: me.role === "admin" ? "APPROVE_ADMIN" : "APPROVE_ATASAN",
          detail: `Bulk action — ${catatan?.trim() || "tanpa catatan"}`,
        },
      });
      result.success.push(b.id);
    } else {
      const data: Record<string, unknown> = {
        rejectedAt: new Date(),
      };
      if (me.role === "admin") {
        data.status = "DITOLAK_ADMIN";
        data.catatanAdmin = catatan!.trim();
        data.adminId = me.id;
        data.adminNama = me.namaLengkap;
      } else {
        data.status = "DITOLAK_ATASAN";
        data.catatanAtasan = catatan!.trim();
        data.atasanId = me.id;
        data.atasanNama = me.namaLengkap;
      }
      await prisma.booking.update({ where: { id: b.id }, data });
      await prisma.auditLog.create({
        data: {
          bookingId: b.id,
          userId: me.id,
          actorName: me.namaLengkap,
          actorRole: me.role,
          action: me.role === "admin" ? "REJECT_ADMIN" : "REJECT_ATASAN",
          detail: `Bulk action — ${catatan!.trim()}`,
        },
      });
      result.success.push(b.id);
    }
  }

  return NextResponse.json(result);
}
