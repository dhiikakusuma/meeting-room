import { prisma } from "@/lib/prisma";
import { RuanganManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function KelolaRuanganPage() {
  const items = await prisma.ruangan.findMany({
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
  });
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="serif text-2xl font-semibold text-ink-900">Kelola Ruangan</h1>
      <p className="text-sm text-ink-500 mt-1">
        Tambah, edit, atau nonaktifkan ruangan rapat. Ruangan nonaktif tidak muncul di form pemohon.
      </p>
      <div className="mt-5">
        <RuanganManager initial={items} />
      </div>
    </div>
  );
}
