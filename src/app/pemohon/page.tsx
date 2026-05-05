import Link from "next/link";
import { CalendarRange, ChevronRight, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatTanggal } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function PemohonDashboard() {
  const me = (await getSessionUser())!;

  const [counts, latest, ruangan] = await Promise.all([
    prisma.booking.groupBy({
      by: ["status"],
      where: { pemohonId: me.id },
      _count: true,
    }),
    prisma.booking.findMany({
      where: { pemohonId: me.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { ruangan: { select: { nama: true, lantai: true } } },
    }),
    prisma.ruangan.findFirst({ where: { aktif: true }, orderBy: { urutan: "asc" } }),
  ]);

  const summary = {
    menunggu: 0,
    disetujui: 0,
    ditolak: 0,
  };
  for (const c of counts) {
    if (c.status === "MENUNGGU_ADMIN" || c.status === "MENUNGGU_ATASAN") summary.menunggu += c._count;
    else if (c.status === "DISETUJUI") summary.disetujui += c._count;
    else if (c.status === "DITOLAK_ADMIN" || c.status === "DITOLAK_ATASAN") summary.ditolak += c._count;
  }

  return (
    <div className="space-y-6">
      {/* Hero room banner */}
      <section className="hero-room rounded-3xl overflow-hidden px-5 sm:px-8 pt-6 pb-7 text-cream-50">
        <p className="serif text-[10.5px] tracking-[0.18em] text-gold-200 uppercase">
          Pemohon
        </p>
        <h1 className="serif text-2xl sm:text-3xl mt-1">
          Halo, <em>{me.namaLengkap}</em>.
        </h1>
        <p className="text-[12px] text-cream-100/80 mt-0.5">
          {me.bidang?.nama ?? me.jabatan ?? "—"}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center max-w-md">
          <Stat label="Menunggu" value={summary.menunggu} />
          <Stat label="Disetujui" value={summary.disetujui} />
          <Stat label="Ditolak" value={summary.ditolak} />
        </div>
      </section>

      <div className="space-y-6">
        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/pemohon/booking/baru">
              <PlusCircle className="h-4 w-4" />
              Buat booking baru
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link href="/pemohon/kalender">
              <CalendarRange className="h-4 w-4" />
              Lihat kalender ruangan
            </Link>
          </Button>
        </div>

        {/* Active room card */}
        {ruangan && (
          <div className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
            <div className="room-soft h-36 sm:h-44" />
            <div className="p-5">
              <p className="text-[10.5px] tracking-[0.16em] text-gold-700 uppercase serif">
                Ruangan Tersedia
              </p>
              <p className="serif text-lg font-semibold text-ink-900 mt-0.5">
                {ruangan.nama}
              </p>
              <p className="text-xs text-ink-500 mt-0.5">
                {ruangan.lantai} · Kapasitas {ruangan.kapasitas} orang
              </p>
              {ruangan.fasilitas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {ruangan.fasilitas.slice(0, 6).map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-ink-200 px-2 py-0.5 text-[11px] text-ink-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent bookings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="serif text-base font-semibold text-ink-900">
              Booking terbaru
            </h2>
            <Link
              href="/pemohon/riwayat"
              className="text-xs text-gold-700 hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          {latest.length === 0 ? (
            <EmptyState
              title="Belum ada booking"
              description="Ayo buat booking pertama untuk acara Anda."
              action={
                <Button asChild size="default">
                  <Link href="/pemohon/booking/baru">Buat booking</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {latest.map((b) => (
                <Link
                  key={b.id}
                  href={`/pemohon/booking/${b.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 hover:border-ink-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
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
                  <ChevronRight className="h-4 w-4 text-ink-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/15 py-3 backdrop-blur-sm">
      <p className="serif text-xl nums">{value}</p>
      <p className="text-[9.5px] text-cream-100/80 uppercase tracking-wider">{label}</p>
    </div>
  );
}
