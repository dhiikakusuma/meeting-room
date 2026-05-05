"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarRange,
  ClipboardList,
  DoorOpen,
  FileSpreadsheet,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Building2,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_CONFIG: Record<"pemohon" | "admin" | "atasan", NavItem[]> = {
  pemohon: [
    { href: "/pemohon", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pemohon/booking/baru", label: "Booking Baru", icon: PlusCircle },
    { href: "/pemohon/kalender", label: "Kalender", icon: CalendarRange },
    { href: "/pemohon/riwayat", label: "Riwayat", icon: History },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/booking", label: "Inbox Booking", icon: Inbox },
    { href: "/admin/riwayat", label: "Riwayat", icon: History },
    { href: "/admin/kalender", label: "Kalender", icon: CalendarRange },
    { href: "/admin/ruangan", label: "Kelola Ruangan", icon: DoorOpen },
    { href: "/admin/bidang", label: "Kelola Bidang", icon: Building2 },
    { href: "/admin/export", label: "Export Excel", icon: FileSpreadsheet },
  ],
  atasan: [
    { href: "/atasan", label: "Dashboard", icon: LayoutDashboard },
    { href: "/atasan/booking", label: "Inbox Persetujuan", icon: ClipboardList },
    { href: "/atasan/riwayat", label: "Riwayat", icon: History },
    { href: "/atasan/pengaturan", label: "Pengaturan", icon: Settings },
  ],
};

type Props = {
  role: "pemohon" | "admin" | "atasan";
  user: { namaLengkap: string; jabatan: string | null; bidang: { nama: string } | null };
  children: React.ReactNode;
};

const ROLE_LABEL: Record<string, string> = {
  pemohon: "Pemohon",
  admin: "Admin Ruangan",
  atasan: "Atasan",
};

export function AppShell({ role, user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = NAV_CONFIG[role];

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Mobile nav bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white border-b border-ink-100">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="serif text-sm font-semibold text-ink-900">DP3AKB</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 hover:bg-cream-100"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="md:grid md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-20 w-64 border-r border-ink-100 bg-white transition-transform md:static md:translate-x-0 md:w-auto",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="hidden md:flex items-center gap-3 px-5 h-16 border-b border-ink-100">
            <Logo size="sm" />
            <div>
              <p className="serif text-sm font-semibold text-ink-900 leading-tight">
                DP3AKB
              </p>
              <p className="text-[10px] tracking-[0.18em] text-ink-500 uppercase">
                Booking Ruang
              </p>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-ink-100 bg-cream-50/50">
            <p className="text-[10px] tracking-[0.16em] text-gold-700 uppercase serif">
              {ROLE_LABEL[role]}
            </p>
            <p className="serif text-sm font-semibold text-ink-900 mt-1 truncate">
              {user.namaLengkap}
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5 truncate">
              {user.bidang?.nama ?? user.jabatan ?? "—"}
            </p>
          </div>

          <nav className="p-3 space-y-0.5">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-ink-900 text-cream-50"
                      : "text-ink-700 hover:bg-cream-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-ink-100 mt-auto absolute bottom-0 inset-x-0 bg-white">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* Backdrop */}
        {open && (
          <div
            className="md:hidden fixed inset-0 z-10 bg-ink-900/40"
            onClick={() => setOpen(false)}
          />
        )}

        <main className="min-h-screen">
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8 py-6 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
