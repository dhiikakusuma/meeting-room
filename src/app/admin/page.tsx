import Link from "next/link";
import { CalendarRange, ChevronRight, FileSpreadsheet, Inbox, DoorOpen, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatTanggal } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const me = (await getSessionUser())!;

  const [counts, inbox, ruangan, totalRuangan, totalBidang] = await Promise.all([
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    prisma.booking.findMany({
      where: { status: { in: ["MENUNGGU_ADMIN", "MENUNGGU_ATASAN"] } },
      orderBy: { createdAt: "asc" },
      take: 5,
      include: { ruangan: { select: { nama: true } } },
    }),
    prisma.ruangan.findFirst({ where: { aktif: true }, orderBy: { urutan: "asc" } }),
    prisma.ruangan.count(),
    prisma.bidang.count(),
  ]);

  // MENUNGGU_ATASAN adalah status legacy — admin sekarang adalah approver
  // final, jadi keduanya digabung jadi 1 antrian "menunggu persetujuan".
  const summary = {
    pending: 0,
    disetujui: 0,
    ditolak: 0,
  };
  for (const c of counts) {
    if (c.status === "MENUNGGU_ADMIN" || c.status === "MENUNGGU_ATASAN") {
      summary.pending += c._count;
    } else if (c.status === "DISETUJUI") {
      summary.disetujui = c._count;
    } else if (c.status === "DITOLAK_ADMIN" || c.status === "DITOLAK_ATASAN") {
      summary.ditolak += c._count;
    }
  }

  return (
    <div className="space-y-6">
      <section className="hero-room rounded-3xl overflow-hidden px-5 sm:px-8 pt-6 pb-7 text-cream-50">
        <p className="serif text-[10.5px] tracking-[0.18em] text-gold-200 uppercase">
          Admin Ruangan
        </p>
        <h1 className="serif text-2xl sm:text-3xl mt-1">
          Selamat bertugas, <em>{me.namaLengkap}</em>.
        </h1>

        <div className="mt-5 grid grid-cols-3 gap-2 max-w-md">
          <Stat label="Menunggu" value={summary.pending} highlight />
          <Stat label="Disetujui" value={summary.disetujui} />
          <Stat label="Ditolak" value={summary.ditolak} />
        </div>
      </section>

      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction href="/admin/booking" icon={Inbox} label="Inbox Booking" badge={summary.pending} />
          <QuickAction href="/admin/kalender" icon={CalendarRange} label="Kalender" />
          <QuickAction href="/admin/ruangan" icon={DoorOpen} label="Kelola Ruangan" sub={`${totalRuangan} ruangan`} />
          <QuickAction href="/admin/bidang" icon={Building2} label="Kelola Bidang" sub={`${totalBidang} bidang`} />
        </div>

        {ruangan && (
          <div className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
            <div className="room-soft h-32 sm:h-40" />
            <div className="p-5 flex items-end justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10.5px] tracking-[0.16em] uppercase serif text-gold-700">
                  Ruangan Aktif
                </p>
                <p className="serif text-lg font-semibold text-ink-900">{ruangan.nama}</p>
                <p className="text-xs text-ink-500">
                  {ruangan.lantai ?? "—"} · {ruangan.kapasitas} orang
                </p>
              </div>
              <Button asChild variant="ghost" size="default">
                <Link href="/admin/ruangan">Kelola</Link>
              </Button>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="serif text-base font-semibold text-ink-900">Inbox Persetujuan</h2>
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/export">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Export Excel
                </Link>
              </Button>
              <Link
                href="/admin/booking"
                className="text-xs text-gold-700 hover:underline self-center"
              >
                Lihat semua
              </Link>
            </div>
          </div>

          {inbox.length === 0 ? (
            <EmptyState
              title="Inbox kosong"
              description="Tidak ada pengajuan yang menunggu persetujuan admin."
            />
          ) : (
            <div className="space-y-2">
              {inbox.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/booking/${b.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 hover:border-ink-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="serif text-sm font-semibold text-ink-900 truncate">
                      {b.agenda}
                    </p>
                    <p className="text-[11.5px] text-ink-500 mt-0.5 nums">
                      {b.pemohonNama} · {b.bidangNama} · {formatTanggal(b.tanggal)} · {b.jamMulai}–{b.jamSelesai}
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

function QuickAction({
  href,
  icon: Icon,
  label,
  badge,
  sub,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 hover:border-gold-300 transition-colors"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold-50 border border-gold-200 text-gold-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="serif text-sm font-semibold text-ink-900">{label}</p>
        {sub && <p className="text-[11px] text-ink-500">{sub}</p>}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-rose-100 text-rose-700 text-[11px] px-2 py-0.5 font-semibold nums">
          {badge}
        </span>
      )}
    </Link>
  );
}
