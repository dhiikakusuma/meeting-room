import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, FileText, Users } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await getSessionUser();
  if (session?.role === "pemohon") redirect("/pemohon");
  if (session?.role === "admin") redirect("/admin");

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Brand band — black text on white */}
      <header className="bg-white border-b border-ink-100 px-6 py-5 text-center">
        <p className="serif text-base font-semibold tracking-[0.16em] text-ink-900">
          DP3AKB
        </p>
        <p className="text-[11px] tracking-[0.18em] text-ink-700 uppercase mt-1">
          Kota Balikpapan
        </p>
      </header>

      {/* Hero photo */}
      <section className="relative flex-1 flex flex-col text-cream-50 hero-building min-h-[420px] sm:min-h-[520px]">
        <div className="relative z-10 mt-auto px-6 sm:px-12 py-12 sm:py-16 max-w-3xl">
          <span
            className="block h-px w-16 mb-4"
            style={{ background: "linear-gradient(90deg, #dfb13a, transparent)" }}
          />
          <p className="serif text-[11px] sm:text-xs uppercase tracking-[0.22em] text-gold-300">
            Booking Dulu Aja
          </p>
          <h1 className="serif text-3xl sm:text-5xl leading-[1.1] mt-2">
            Ruang Rapat{" "}
            <em className="text-gold-200">DP3AKB Kota Balikpapan</em>
          </h1>
        </div>
      </section>

      {/* CTA panel */}
      <section className="bg-white border-t border-ink-100 px-6 py-8 sm:py-10">
        <div className="max-w-md mx-auto space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/login/pemohon">
              Masuk sebagai Pemohon
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="default" className="w-full">
            <Link href="/login/admin">Masuk sebagai Admin</Link>
          </Button>
          <p className="text-[11px] text-ink-500 text-center pt-3">
            Pemohon hanya butuh nama · Admin masuk dengan password
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12 grid sm:grid-cols-3 gap-4">
          <Feature
            icon={<FileText className="h-4 w-4" />}
            title="Formulir resmi"
            text="Ajukan booking lengkap dengan agenda, jam, dan kebutuhan."
          />
          <Feature
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Verifikasi admin"
            text="Admin memverifikasi & menandatangani — anti double-booking."
          />
          <Feature
            icon={<Users className="h-4 w-4" />}
            title="Surat resmi PDF"
            text="Unduh surat resmi dengan nomor & tanda tangan pemohon dan admin."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 p-5">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-50 text-gold-700 border border-gold-200">
        {icon}
      </div>
      <p className="serif text-sm font-semibold text-ink-900 mt-3">{title}</p>
      <p className="text-xs text-ink-500 mt-1 leading-relaxed">{text}</p>
    </div>
  );
}
