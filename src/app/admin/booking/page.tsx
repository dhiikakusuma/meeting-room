import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { BookingInboxAdmin } from "./inbox";

export const dynamic = "force-dynamic";

export default async function AdminInboxPage() {
  const me = await requireRole("admin");
  if (!me) redirect("/login/admin");

  const items = await prisma.booking.findMany({
    // Admin sebagai approver final melihat semua antrian (termasuk MENUNGGU_ATASAN
    // legacy) di satu inbox.
    where: { status: { in: ["MENUNGGU_ADMIN", "MENUNGGU_ATASAN"] } },
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
          currentUserName={me.namaLengkap}
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
