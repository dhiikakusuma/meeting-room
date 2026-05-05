import { prisma } from "@/lib/prisma";
import { BidangManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function KelolaBidangPage() {
  const items = await prisma.bidang.findMany({
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    select: {
      id: true,
      nama: true,
      kode: true,
      aktif: true,
      urutan: true,
      _count: { select: { users: true } },
    },
  });
  return (
    <div className="px-5 sm:px-8 py-6 max-w-3xl">
      <h1 className="serif text-2xl font-semibold text-ink-900">Kelola Bidang / Unit Kerja</h1>
      <p className="text-sm text-ink-500 mt-1">
        Daftar bidang ini akan tampil sebagai pilihan di halaman login pemohon.
      </p>
      <div className="mt-5">
        <BidangManager
          initial={items.map((b) => ({
            id: b.id,
            nama: b.nama,
            kode: b.kode,
            aktif: b.aktif,
            urutan: b.urutan,
            jumlahPemohon: b._count.users,
          }))}
        />
      </div>
    </div>
  );
}
