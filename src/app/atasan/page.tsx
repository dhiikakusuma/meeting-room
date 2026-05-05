import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatTanggal } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function AtasanDashboard() {
  const me = (await getSessionUser())!;

  const [counts, inbox] = await Promise.all([
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    prisma.booking.findMany({
      where: { status: "MENUNGGU_ATASAN" },
      orderBy: { approvedAdminAt: "asc" },
      take: 5,
      include: { ruangan: { select: { nama: true } } },
    }),
  ]);

  const summary = {
    pending: 0,
    disetujui: 0,
    ditolak: 0,
  };
  for (const c of counts) {
    if (c.status === "MENUNGGU_ATASAN") summary.pending = c._count;
    else if (c.status === "DISETUJUI") summary.disetujui = c._count;
    else if (c.status === "DITOLAK_ATASAN") summary.ditolak = c._count;
  }

  return (
    <div className="space-y-6">
      <section className="hero-room rounded-3xl overflow-hidden px-5 sm:px-8 pt-6 pb-7 text-cream-50">
        <p className="serif text-[10.5px] tracking-[0.18em] text-gold-200 uppercase">
          Persetujuan Akhir
        </p>
        <h1 className="serif text-2xl sm:text-3xl mt-1">
          Selamat datang, <em>{me.namaLengkap}</em>.
        </h1>
        <p className="text-[12px] text-cream-100/80 mt-0.5">{me.jabatan ?? "—"}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 max-w-md">
          <Stat label="Menunggu" value={summary.pending} highlight />
          <Stat label="Disetujui" value={summary.disetujui} />
          <Stat label="Ditolak" value={summary.ditolak} />
        </div>
      </section>

      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <Button asChild size="lg" variant="gold" className="w-full">
            <Link href="/atasan/booking">
              <ClipboardList className="h-4 w-4" />
              Inbox Persetujuan
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link href="/atasan/riwayat">Lihat Riwayat</Link>
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="serif text-base font-semibold text-ink-900">
              Menunggu persetujuan akhir
            </h2>
            <Link href="/atasan/booking" className="text-xs text-gold-700 hover:underline">
              Lihat semua
            </Link>
          </div>
          {inbox.length === 0 ? (
            <EmptyState
              title="Tidak ada yang menunggu"
              description="Semua pengajuan sudah ditangani. Terima kasih."
            />
          ) : (
            <div className="space-y-2">
              {inbox.map((b) => (
                <Link
                  key={b.id}
                  href={`/atasan/booking/${b.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 hover:border-gold-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="serif text-sm font-semibold text-ink-900 truncate">
                      {b.agenda}
                    </p>
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
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border py-3 px-3 backdrop-blur-sm ${
        highlight ? "bg-gold-300/20 border-gold-200/40" : "bg-black/30 border-white/15"
      }`}
    >
      <p className="serif text-xl nums">{value}</p>
      <p className="text-[9.5px] text-cream-100/80 uppercase tracking-wider">{label}</p>
    </div>
  );
}
