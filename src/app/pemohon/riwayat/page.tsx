import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatTanggal } from "@/lib/datetime";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; bulan?: string }>;

export default async function RiwayatPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const me = (await getSessionUser())!;
  const sp = await searchParams;
  const status = sp.status;
  const bulan = sp.bulan;

  const where: Record<string, unknown> = { pemohonId: me.id };
  if (status) where.status = status;
  if (bulan) {
    const [y, m] = bulan.split("-").map(Number);
    where.tanggal = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const list = await prisma.booking.findMany({
    where,
    orderBy: [{ tanggal: "desc" }, { jamMulai: "asc" }],
    include: { ruangan: { select: { nama: true } } },
  });

  const filterChip = (label: string, value: string | null) => {
    const params = new URLSearchParams();
    if (status && status !== value) params.set("status", status);
    if (bulan) params.set("bulan", bulan);
    if (value) params.set("status", value);
    const active = status === value || (!status && !value);
    return (
      <Link
        key={label}
        href={`/pemohon/riwayat${params.toString() ? `?${params.toString()}` : ""}`}
        className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
          active
            ? "bg-ink-900 text-cream-50 border-ink-900"
            : "bg-white text-ink-700 border-ink-200 hover:bg-cream-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  // Generate list of last 6 months
  const months: { label: string; value: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      value,
      label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="serif text-2xl font-semibold text-ink-900">Riwayat Booking</h1>
      <p className="text-sm text-ink-500 mt-1">
        Lihat seluruh pengajuan Anda. Filter berdasarkan status atau bulan.
      </p>

      <div className="mt-5 space-y-2">
        <div className="flex flex-wrap gap-2">
          {filterChip("Semua", null)}
          {filterChip("Menunggu Admin", "MENUNGGU_ADMIN")}
          {filterChip("Menunggu Atasan", "MENUNGGU_ATASAN")}
          {filterChip("Disetujui", "DISETUJUI")}
          {filterChip("Ditolak", "DITOLAK_ADMIN")}
          {filterChip("Dibatalkan", "BATAL_PEMOHON")}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={status ? `/pemohon/riwayat?status=${status}` : "/pemohon/riwayat"}
            className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
              !bulan
                ? "bg-ink-900 text-cream-50 border-ink-900"
                : "bg-white text-ink-700 border-ink-200 hover:bg-cream-100"
            }`}
          >
            Semua bulan
          </Link>
          {months.map((m) => (
            <Link
              key={m.value}
              href={`/pemohon/riwayat?${status ? `status=${status}&` : ""}bulan=${m.value}`}
              className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
                bulan === m.value
                  ? "bg-ink-900 text-cream-50 border-ink-900"
                  : "bg-white text-ink-700 border-ink-200 hover:bg-cream-100"
              }`}
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {list.length === 0 ? (
          <EmptyState
            title="Tidak ada riwayat"
            description="Belum ada booking yang sesuai dengan filter ini."
          />
        ) : (
          <div className="space-y-2">
            {list.map((b) => (
              <Link
                key={b.id}
                href={`/pemohon/booking/${b.id}`}
                className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 hover:border-ink-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={b.status} />
                    {b.nomorSurat && (
                      <span className="text-[10.5px] text-ink-400 nums">
                        {b.nomorSurat}
                      </span>
                    )}
                  </div>
                  <p className="serif text-sm font-semibold text-ink-900 truncate">
                    {b.agenda}
                  </p>
                  <p className="text-[11.5px] text-ink-500 mt-0.5 nums">
                    {formatTanggal(b.tanggal)} · {b.jamMulai}–{b.jamSelesai} ·{" "}
                    {b.ruangan.nama}
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
