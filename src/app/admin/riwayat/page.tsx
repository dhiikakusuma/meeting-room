import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatTanggal } from "@/lib/datetime";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; bulan?: string; bidangId?: string }>;

export default async function AdminRiwayatPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;
  if (sp.bidangId) where.bidangId = sp.bidangId;
  if (sp.bulan) {
    const [y, m] = sp.bulan.split("-").map(Number);
    where.tanggal = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }
  const list = await prisma.booking.findMany({
    where,
    orderBy: [{ tanggal: "desc" }, { jamMulai: "asc" }],
    take: 200,
    include: { ruangan: { select: { nama: true } } },
  });

  const months: { label: string; value: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    });
  }

  const statuses = [
    ["Semua", null],
    ["Menunggu Admin", "MENUNGGU_ADMIN"],
    ["Menunggu Atasan", "MENUNGGU_ATASAN"],
    ["Disetujui", "DISETUJUI"],
    ["Ditolak Admin", "DITOLAK_ADMIN"],
    ["Ditolak Atasan", "DITOLAK_ATASAN"],
    ["Dibatalkan", "BATAL_PEMOHON"],
  ] as const;

  return (
    <div className="px-5 sm:px-8 py-6 max-w-5xl">
      <h1 className="serif text-2xl font-semibold text-ink-900">Riwayat Booking</h1>
      <p className="text-sm text-ink-500 mt-1">
        Daftar lengkap semua pengajuan. Total {list.length} record (maks 200).
      </p>

      <div className="mt-5 space-y-2">
        <div className="flex flex-wrap gap-2">
          {statuses.map(([label, value]) => {
            const params = new URLSearchParams();
            if (value) params.set("status", value);
            if (sp.bulan) params.set("bulan", sp.bulan);
            const href = `/admin/riwayat${params.toString() ? `?${params.toString()}` : ""}`;
            const active = sp.status === value || (!sp.status && !value);
            return (
              <Link
                key={label}
                href={href}
                className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
                  active
                    ? "bg-ink-900 text-cream-50 border-ink-900"
                    : "bg-white text-ink-700 border-ink-200 hover:bg-cream-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        {list.length === 0 ? (
          <EmptyState
            title="Belum ada data"
            description="Tidak ada booking yang cocok dengan filter ini."
          />
        ) : (
          <div className="space-y-2">
            {list.map((b) => (
              <Link
                key={b.id}
                href={`/admin/booking/${b.id}`}
                className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 hover:border-ink-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={b.status} />
                    {b.nomorSurat && (
                      <span className="text-[10.5px] text-ink-400 nums">{b.nomorSurat}</span>
                    )}
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
