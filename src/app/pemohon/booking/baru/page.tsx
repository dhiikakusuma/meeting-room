import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/booking-form";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BookingBaruPage() {
  const me = await requireRole("pemohon");
  if (!me) redirect("/login/pemohon");
  const ruangan = await prisma.ruangan.findMany({
    where: { aktif: true },
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    select: {
      id: true,
      nama: true,
      lantai: true,
      kapasitas: true,
      fasilitas: true,
    },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/pemohon"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke dashboard
      </Link>
      <h1 className="serif text-2xl font-semibold text-ink-900 mt-3">Booking baru</h1>
      <p className="text-sm text-ink-500 mt-1">
        Lengkapi formulir di bawah. Pastikan jam tidak bentrok dengan booking yang sudah disetujui.
      </p>
      <div className="divider-gold my-6" />
      <BookingForm ruangan={ruangan} pemohonNama={me.namaLengkap} />
    </div>
  );
}
