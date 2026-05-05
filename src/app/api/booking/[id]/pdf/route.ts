import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateBookingPdf } from "@/lib/pdf-booking";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { ruangan: true },
  });
  if (!booking) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  if (me.role === "pemohon" && booking.pemohonId !== me.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status !== "DISETUJUI" || !booking.nomorSurat) {
    return NextResponse.json({ error: "Surat baru tersedia setelah disetujui" }, { status: 400 });
  }

  const reqUrl = new URL(req.url);
  const verifyUrl = `${reqUrl.origin}/verify/${booking.id}`;

  const pdf = await generateBookingPdf({
    nomorSurat: booking.nomorSurat,
    pemohonNama: booking.pemohonNama,
    bidangNama: booking.bidangNama,
    ruanganNama: booking.ruanganNama,
    ruanganLantai: booking.ruangan.lantai,
    tanggal: booking.tanggal,
    jamMulai: booking.jamMulai,
    jamSelesai: booking.jamSelesai,
    agenda: booking.agenda,
    jumlahPeserta: booking.jumlahPeserta,
    kebutuhan: booking.kebutuhan,
    catatanAdmin: booking.catatanAdmin,
    catatanAtasan: booking.catatanAtasan,
    adminNama: booking.adminNama,
    atasanNama: booking.atasanNama,
    atasanJabatan: booking.atasanJabatan,
    approvedAtasanAt: booking.approvedAtasanAt,
    verifyUrl,
  });

  const filename = `surat-${booking.nomorSurat.replace(/\//g, "_")}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
