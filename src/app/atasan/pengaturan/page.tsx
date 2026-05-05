import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";

export default async function AtasanPengaturanPage() {
  const me = await requireRole("atasan");
  if (!me) redirect("/login/atasan");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="serif text-2xl font-semibold text-ink-900">Pengaturan Profil</h1>
      <p className="text-sm text-ink-500 mt-1">
        Perbarui nama lengkap dan jabatan Anda. Data ini muncul di kop surat & blok tanda tangan PDF.
      </p>
      <div className="divider-gold my-6" />
      <ProfileForm
        initial={{
          namaLengkap: me.namaLengkap,
          jabatan: me.jabatan ?? "",
        }}
      />
    </div>
  );
}
