import { prisma } from "@/lib/prisma";
import { BookingInboxAdmin } from "./inbox";

export const dynamic = "force-dynamic";

export default async function AdminInboxPage() {
  const items = await prisma.booking.findMany({
    where: { status: "MENUNGGU_ADMIN" },
    orderBy: { createdAt: "asc" },
    include: { ruangan: { select: { nama: true } } },
  });
  return (
    <div>
      <h1 className="serif text-2xl font-semibold text-ink-900">Inbox Booking</h1>
      <p className="text-sm text-ink-500 mt-1">
        {items.length} pengajuan menunggu persetujuan admin. Anda dapat menyetujui satu per satu atau secara massal.
      </p>
      <div className="mt-5">
        <BookingInboxAdmin
          items={items.map((b) => ({
            id: b.id,
            agenda: b.agenda,
            pemohonNama: b.pemohonNama,
            bidangNama: b.bidangNama,
            ruanganNama: b.ruangan.nama,
            tanggal: b.tanggal.toISOString(),
            jamMulai: b.jamMulai,
            jamSelesai: b.jamSelesai,
            jumlahPeserta: b.jumlahPeserta,
            createdAt: b.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
