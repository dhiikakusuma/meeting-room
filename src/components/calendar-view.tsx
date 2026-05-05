"use client";

import { useEffect, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./skeleton";
import {
  formatDateInput,
  formatTanggalLong,
  generateSlots,
  parseDateInput,
} from "@/lib/datetime";

type Ruangan = { id: string; nama: string; lantai: string | null };

type Booked = {
  id: string;
  pemohonNama: string;
  bidangNama: string;
  jamMulai: string;
  jamSelesai: string;
  status: string;
  agenda: string;
};

export function CalendarView({ ruangan }: { ruangan: Ruangan[] }) {
  const today = formatDateInput(new Date());
  const [tanggal, setTanggal] = useState(today);
  const [ruanganId, setRuanganId] = useState(ruangan[0]?.id ?? "");
  const [data, setData] = useState<Booked[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ruanganId || !tanggal) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/booking/availability?ruanganId=${ruanganId}&tanggal=${tanggal}`)
      .then((r) => r.json())
      .then((d) => setData(d.bookings ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [ruanganId, tanggal]);

  const slots = generateSlots();

  function shift(days: number) {
    const d = parseDateInput(tanggal);
    d.setDate(d.getDate() + days);
    setTanggal(formatDateInput(d));
  }

  function findBooking(slotStart: string) {
    return data.find(
      (b) => slotStart >= b.jamMulai && slotStart < b.jamSelesai,
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink-100 bg-white p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Sebelumnya">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="h-9 rounded-lg border border-ink-200 px-3 text-sm nums"
          />
          <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Berikutnya">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <select
          value={ruanganId}
          onChange={(e) => setRuanganId(e.target.value)}
          className="h-9 rounded-lg border border-ink-200 bg-white px-3 text-sm focus:border-gold-400 focus:outline-none"
        >
          {ruangan.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nama}
              {r.lantai ? ` · ${r.lantai}` : ""}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setTanggal(today)}>
          <CalendarRange className="h-3.5 w-3.5" />
          Hari ini
        </Button>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <p className="serif text-base font-semibold text-ink-900">
          {formatTanggalLong(parseDateInput(tanggal))}
        </p>
        <p className="text-[11px] text-ink-500 mt-0.5">
          Slot 30 menit, 08:00–17:00 (hanya hari kerja)
        </p>

        <div className="mt-4 space-y-1.5">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))
          ) : (
            slots.map((s) => {
              const b = findBooking(s.start);
              const tone = !b
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : b.status === "DISETUJUI"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : b.status === "MENUNGGU_ATASAN"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-cream-100 border-ink-200 text-ink-700";
              return (
                <div
                  key={s.start}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${tone}`}
                >
                  <span className="text-[11px] nums w-20 shrink-0">
                    {s.start} – {s.end}
                  </span>
                  <span className="flex-1 text-sm truncate">
                    {b ? (
                      <>
                        <strong className="serif">{b.agenda}</strong>
                        <span className="text-[11px] opacity-80 ml-2">
                          {b.pemohonNama} · {b.bidangNama}
                        </span>
                      </>
                    ) : (
                      <span className="opacity-60">— kosong —</span>
                    )}
                  </span>
                  {b && (
                    <span className="text-[10px] uppercase tracking-wider opacity-80 nums">
                      {b.status === "DISETUJUI"
                        ? "Terkunci"
                        : b.status === "MENUNGGU_ATASAN"
                          ? "Pending"
                          : "Menunggu"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
