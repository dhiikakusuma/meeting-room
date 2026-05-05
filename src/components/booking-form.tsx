"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  formatDateInput,
  durationLabel,
  generateSlots,
} from "@/lib/datetime";

type Ruangan = {
  id: string;
  nama: string;
  lantai: string | null;
  kapasitas: number;
  fasilitas: string[];
};

type Booked = {
  id: string;
  pemohonNama: string;
  bidangNama: string;
  jamMulai: string;
  jamSelesai: string;
  status: string;
  agenda: string;
};

const FASILITAS_OPSI = ["Proyektor", "AC", "Whiteboard", "Sound System", "WiFi", "Snack", "Konsumsi"];

export function BookingForm({ ruangan }: { ruangan: Ruangan[] }) {
  const router = useRouter();
  const today = formatDateInput(new Date());

  const [ruanganId, setRuanganId] = useState(ruangan[0]?.id ?? "");
  const [tanggal, setTanggal] = useState(today);
  const [jamMulai, setJamMulai] = useState("09:00");
  const [jamSelesai, setJamSelesai] = useState("10:00");
  const [agenda, setAgenda] = useState("");
  const [jumlahPeserta, setJumlahPeserta] = useState(10);
  const [kebutuhan, setKebutuhan] = useState<string[]>([]);
  const [recurring, setRecurring] = useState(false);
  const [occurrences, setOccurrences] = useState(4);
  const [busy, setBusy] = useState(false);

  const [booked, setBooked] = useState<Booked[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);

  useEffect(() => {
    if (!ruanganId || !tanggal) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingAvail(true);
    fetch(`/api/booking/availability?ruanganId=${ruanganId}&tanggal=${tanggal}`)
      .then((r) => r.json())
      .then((d) => setBooked(d.bookings ?? []))
      .catch(() => setBooked([]))
      .finally(() => setLoadingAvail(false));
  }, [ruanganId, tanggal]);

  const selectedRuangan = ruangan.find((r) => r.id === ruanganId);
  const slots = useMemo(() => generateSlots(), []);

  function isSlotBooked(slotStart: string) {
    return booked.find(
      (b) =>
        slotStart >= b.jamMulai &&
        slotStart < b.jamSelesai &&
        (b.status === "DISETUJUI" || b.status === "MENUNGGU_ATASAN"),
    );
  }
  function isSlotPending(slotStart: string) {
    return booked.find(
      (b) =>
        slotStart >= b.jamMulai &&
        slotStart < b.jamSelesai &&
        b.status === "MENUNGGU_ADMIN",
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruanganId) return toast.error("Pilih ruangan");
    if (!agenda.trim()) return toast.error("Catatan agenda wajib diisi");

    setBusy(true);
    const payload: Record<string, unknown> = {
      ruanganId,
      tanggal,
      jamMulai,
      jamSelesai,
      agenda: agenda.trim(),
      jumlahPeserta,
      kebutuhan,
    };
    if (recurring) {
      payload.recurring = { frequency: "WEEKLY", occurrences };
    }
    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal mengajukan booking");
      setBusy(false);
      return;
    }
    toast.success(
      recurring
        ? `${data.count} pengajuan dibuat — menunggu admin`
        : "Booking diajukan — menunggu admin",
    );
    router.replace("/pemohon");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Ruangan */}
      <div>
        <Label htmlFor="ruangan">Ruangan</Label>
        <select
          id="ruangan"
          value={ruanganId}
          onChange={(e) => setRuanganId(e.target.value)}
          className="mt-1.5 flex h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-300/40"
        >
          {ruangan.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nama}
              {r.lantai ? ` · ${r.lantai}` : ""} · {r.kapasitas} kursi
            </option>
          ))}
        </select>
        {selectedRuangan && selectedRuangan.fasilitas.length > 0 && (
          <p className="text-[11px] text-ink-500 mt-1.5">
            Fasilitas: {selectedRuangan.fasilitas.join(", ")}
          </p>
        )}
      </div>

      {/* Tanggal */}
      <div>
        <Label htmlFor="tanggal">Tanggal acara</Label>
        <Input
          id="tanggal"
          type="date"
          value={tanggal}
          min={today}
          onChange={(e) => setTanggal(e.target.value)}
          className="mt-1.5"
        />
      </div>

      {/* Jam mulai & selesai */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="jamMulai">Jam mulai</Label>
          <Input
            id="jamMulai"
            type="time"
            value={jamMulai}
            onChange={(e) => setJamMulai(e.target.value)}
            className="mt-1.5 nums"
            step="900"
          />
        </div>
        <div>
          <Label htmlFor="jamSelesai">Jam selesai</Label>
          <Input
            id="jamSelesai"
            type="time"
            value={jamSelesai}
            onChange={(e) => setJamSelesai(e.target.value)}
            className="mt-1.5 nums"
            step="900"
          />
        </div>
      </div>
      <p className="text-[11px] text-ink-500 -mt-2">
        Durasi: <span className="text-ink-900 nums">{durationLabel(jamMulai, jamSelesai)}</span> · Jam operasional 08:00–17:00
      </p>

      {/* Slot availability hint */}
      <div className="rounded-xl border border-ink-100 bg-cream-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] tracking-[0.14em] uppercase serif text-gold-700">
            Ketersediaan tanggal terpilih
          </p>
          <div className="flex items-center gap-2 text-[10.5px] text-ink-500">
            <Legend color="bg-emerald-400" label="Kosong" />
            <Legend color="bg-amber-400" label="Pending" />
            <Legend color="bg-rose-400" label="Terkunci" />
          </div>
        </div>
        {loadingAvail ? (
          <div className="grid grid-cols-9 gap-1">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="shimmer h-6 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-1">
            {slots.map((s) => {
              const blocked = isSlotBooked(s.start);
              const pending = !blocked && isSlotPending(s.start);
              const tone = blocked
                ? "bg-rose-100 border-rose-200 text-rose-700"
                : pending
                  ? "bg-amber-100 border-amber-200 text-amber-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700";
              return (
                <div
                  key={s.start}
                  title={
                    blocked
                      ? `${blocked.jamMulai}-${blocked.jamSelesai} · ${blocked.bidangNama}`
                      : pending
                        ? "Menunggu approval admin"
                        : "Slot kosong"
                  }
                  className={`text-center text-[10px] nums rounded-md border py-1 ${tone}`}
                >
                  {s.start}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agenda */}
      <div>
        <Label htmlFor="agenda">
          Catatan / Agenda <span className="text-rose-600">*</span>
        </Label>
        <Textarea
          id="agenda"
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          placeholder="Mis. Rapat koordinasi program KIE bulan Mei dengan tim lapangan."
          className="mt-1.5"
          rows={3}
        />
        <p className="text-[11px] text-ink-500 mt-1">
          Wajib diisi — sebutkan acara apa yang akan diselenggarakan.
        </p>
      </div>

      {/* Jumlah peserta */}
      <div>
        <Label htmlFor="peserta">Jumlah peserta</Label>
        <Input
          id="peserta"
          type="number"
          min={1}
          max={selectedRuangan?.kapasitas ?? 500}
          value={jumlahPeserta}
          onChange={(e) => setJumlahPeserta(Number(e.target.value))}
          className="mt-1.5 nums"
        />
        {selectedRuangan && (
          <p className="text-[11px] text-ink-500 mt-1">
            Kapasitas ruangan {selectedRuangan.kapasitas} orang.
          </p>
        )}
      </div>

      {/* Kebutuhan */}
      <div>
        <Label>Kebutuhan tambahan</Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {FASILITAS_OPSI.map((f) => {
            const active = kebutuhan.includes(f);
            return (
              <button
                type="button"
                key={f}
                onClick={() =>
                  setKebutuhan((prev) =>
                    prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
                  )
                }
                className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-ink-900 text-cream-50 border-ink-900"
                    : "bg-white text-ink-700 border-ink-200 hover:bg-cream-100"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recurring */}
      <div className="rounded-xl border border-ink-100 p-4 bg-white">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="mt-1 h-4 w-4 accent-gold-500"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold serif text-ink-900">Rapat berulang setiap minggu</p>
            <p className="text-[11.5px] text-ink-500 mt-0.5">
              Sistem akan otomatis membuat pengajuan untuk beberapa minggu ke depan dengan jam yang sama.
            </p>
          </div>
        </label>
        {recurring && (
          <div className="mt-3 ml-7 flex items-center gap-3">
            <Label htmlFor="occ" className="m-0">
              Jumlah pertemuan
            </Label>
            <Input
              id="occ"
              type="number"
              min={2}
              max={52}
              value={occurrences}
              onChange={(e) => setOccurrences(Number(e.target.value))}
              className="w-24 nums"
            />
            <span className="text-[12px] text-ink-500">minggu</span>
          </div>
        )}
      </div>

      <div className="divider-gold" />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-ink-500">
          Dengan menekan <strong>Ajukan</strong>, pengajuan akan masuk ke inbox admin.
        </p>
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Memproses…" : "Ajukan"}
        </Button>
      </div>
    </form>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
