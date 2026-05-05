import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatTanggal } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function AtasanInboxPage() {
  const items = await prisma.booking.findMany({
    where: { status: "MENUNGGU_ATASAN" },
    orderBy: { approvedAdminAt: "asc" },
    include: { ruangan: { select: { nama: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="serif text-2xl font-semibold text-ink-900">Inbox Persetujuan Akhir</h1>
      <p className="text-sm text-ink-500 mt-1">
        {items.length} pengajuan sudah lulus admin, menunggu persetujuan akhir Anda.
      </p>
      <div className="mt-5">
        {items.length === 0 ? (
          <EmptyState title="Tidak ada yang menunggu" description="Semua pengajuan sudah ditangani." />
        ) : (
          <div className="space-y-2">
            {items.map((b) => (
              <Link
                key={b.id}
                href={`/atasan/booking/${b.id}`}
                className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 hover:border-gold-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="serif text-sm font-semibold text-ink-900 truncate">{b.agenda}</p>
                  <p className="text-[11.5px] text-ink-500 mt-0.5 nums">
                    {b.pemohonNama} · {b.bidangNama}
                  </p>
                  <p className="text-[11.5px] text-ink-500 nums">
                    {formatTanggal(b.tanggal)} · {b.jamMulai}–{b.jamSelesai} · {b.ruangan.nama}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
