import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginAtasanForm } from "./form";

export default function LoginAtasanPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <header className="bg-white border-b border-ink-100 px-6 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-ink-200 text-ink-700 hover:bg-cream-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="serif text-sm font-semibold text-ink-900">Masuk Atasan</p>
          <p className="text-[10.5px] tracking-[0.16em] uppercase text-ink-500">
            Booking Ruang Rapat · DP3AKB
          </p>
        </div>
      </header>
      <div className="hero-building h-32" aria-hidden="true" />

      <div className="flex-1 px-6 py-8 sm:py-12">
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-ink-100 bg-white p-6 sm:p-8">
            <p className="serif text-[11px] uppercase tracking-[0.18em] text-gold-700">
              Persetujuan Final
            </p>
            <h1 className="serif text-2xl font-semibold text-ink-900 mt-1">
              Masuk Atasan
            </h1>
            <p className="text-sm text-ink-500 mt-2">
              Akses panel persetujuan akhir untuk pengajuan ruang rapat.
            </p>
            <div className="divider-gold my-6" />
            <LoginAtasanForm />
          </div>
        </div>
      </div>
    </div>
  );
}
