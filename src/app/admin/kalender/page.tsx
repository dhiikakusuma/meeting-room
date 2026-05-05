import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar-view";

export const dynamic = "force-dynamic";

export default async function AdminKalenderPage() {
  const ruangan = await prisma.ruangan.findMany({
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    select: { id: true, nama: true, lantai: true },
  });
  return (
    <div className="px-5 sm:px-8 py-6 max-w-4xl">
      <h1 className="serif text-2xl font-semibold text-ink-900">Kalender Ruangan</h1>
      <p className="text-sm text-ink-500 mt-1">Cek slot terkunci & pending per ruangan.</p>
      <div className="mt-5">
        <CalendarView ruangan={ruangan} />
      </div>
    </div>
  );
}
