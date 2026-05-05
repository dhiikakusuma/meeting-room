import { prisma } from "@/lib/prisma";
import { ExportForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const [ruangan, bidang] = await Promise.all([
    prisma.ruangan.findMany({
      orderBy: [{ urutan: "asc" }],
      select: { id: true, nama: true },
    }),
    prisma.bidang.findMany({
      orderBy: [{ urutan: "asc" }],
      select: { id: true, nama: true },
    }),
  ]);
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="serif text-2xl font-semibold text-ink-900">Export Excel</h1>
      <p className="text-sm text-ink-500 mt-1">
        Unduh laporan booking dalam format .xlsx, dapat difilter berdasarkan bulan, ruangan, atau bidang.
      </p>
      <div className="divider-gold my-6" />
      <ExportForm ruangan={ruangan} bidang={bidang} />
    </div>
  );
}
