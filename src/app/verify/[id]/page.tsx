import { CheckCircle2, XCircle, Calendar, Clock, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTanggalLong } from "@/lib/datetime";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export default async function VerifyPage({ params }: Ctx) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { ruangan: { select: { nama: true, lantai: true } } },
  });

  const valid = booking && booking.status === "DISETUJUI" && booking.nomorSurat;

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <header className="bg-white border-b border-ink-100 px-6 py-5 text-center">
        <p className="serif text-base font-semibold tracking-[0.16em] text-ink-900">
          Verifikasi Surat Booking
        </p>
        <p className="text-[11px] tracking-[0.18em] text-ink-700 uppercase mt-1">
          DP3AKB Kota Balikpapan
        </p>
      </header>

      <div className="flex-1 px-6 py-10">
        <div className="max-w-md mx-auto">
          {valid ? (
            <div className="rounded-2xl border border-emerald-200 bg-white p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-ink-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                <div>
                  <p className="serif text-base font-semibold text-ink-900">Surat sah</p>
                  <p className="text-[11px] text-ink-500 nums">{booking.nomorSurat}</p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={booking.status} />
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <Row icon={<Users className="h-4 w-4" />} label="Pemohon" value={`${booking.pemohonNama} · ${booking.bidangNama}`} />
                <Row icon={<MapPin className="h-4 w-4" />} label="Ruangan" value={`${booking.ruangan.nama}${booking.ruangan.lantai ? ` · ${booking.ruangan.lantai}` : ""}`} />
                <Row icon={<Calendar className="h-4 w-4" />} label="Tanggal" value={formatTanggalLong(booking.tanggal)} />
                <Row icon={<Clock className="h-4 w-4" />} label="Waktu" value={`${booking.jamMulai} – ${booking.jamSelesai}`} />
                <Row icon={<Users className="h-4 w-4" />} label="Peserta" value={`${booking.jumlahPeserta} orang`} />
              </div>

              <div className="mt-5 rounded-xl bg-cream-50 border border-ink-100 p-4">
                <p className="text-[10.5px] tracking-[0.14em] uppercase text-ink-500 serif">Agenda</p>
                <p className="text-sm text-ink-900 mt-1">{booking.agenda}</p>
              </div>

              <div className="mt-4 text-[11px] text-ink-500">
                Disetujui oleh:{" "}
                <span className="text-ink-700">{booking.atasanNama ?? "—"}</span>
                {booking.atasanJabatan ? ` (${booking.atasanJabatan})` : ""}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center">
              <XCircle className="h-10 w-10 text-rose-600 mx-auto" />
              <p className="serif text-base font-semibold text-ink-900 mt-3">
                Surat tidak ditemukan / belum disahkan
              </p>
              <p className="text-sm text-ink-500 mt-1">
                Pastikan QR Code di-scan dari surat resmi terbaru.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gold-700 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] text-ink-500 uppercase tracking-[0.14em]">{label}</p>
        <p className="text-sm text-ink-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
