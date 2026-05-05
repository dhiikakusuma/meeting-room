import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar-view";

export const dynamic = "force-dynamic";

export default async function PemohonKalenderPage() {
  const ruangan = await prisma.ruangan.findMany({
    where: { aktif: true },
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    select: { id: true, nama: true, lantai: true },
  });
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="serif text-2xl font-semibold text-ink-900">Kalender Ruangan</h1>
      <p className="text-sm text-ink-500 mt-1">
        Cek slot kosong sebelum membuat booking baru.
      </p>
      <div className="mt-5">
        <CalendarView ruangan={ruangan} />
      </div>
    </div>
  );
}
