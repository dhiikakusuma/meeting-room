"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Opt = { id: string; nama: string };

export function ExportForm({ ruangan, bidang }: { ruangan: Opt[]; bidang: Opt[] }) {
  const [bulan, setBulan] = useState("");
  const [status, setStatus] = useState("");
  const [ruanganId, setRuanganId] = useState("");
  const [bidangId, setBidangId] = useState("");

  function buildUrl() {
    const p = new URLSearchParams();
    if (bulan) p.set("month", bulan);
    if (status) p.set("status", status);
    if (ruanganId) p.set("ruanganId", ruanganId);
    if (bidangId) p.set("bidangId", bidangId);
    return `/api/booking/export${p.toString() ? `?${p.toString()}` : ""}`;
  }

  // Generate last 12 months
  const months: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    });
  }

  const inputCls =
    "mt-1.5 flex h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-300/40";

  return (
    <div className="space-y-4">
      <div>
        <Label>Bulan</Label>
        <select value={bulan} onChange={(e) => setBulan(e.target.value)} className={inputCls}>
          <option value="">Semua bulan</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Status</Label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          <option value="">Semua status</option>
          <option value="MENUNGGU_ADMIN">Menunggu Admin</option>
          <option value="MENUNGGU_ATASAN">Menunggu Atasan</option>
          <option value="DISETUJUI">Disetujui</option>
          <option value="DITOLAK_ADMIN">Ditolak Admin</option>
          <option value="DITOLAK_ATASAN">Ditolak Atasan</option>
          <option value="BATAL_PEMOHON">Dibatalkan</option>
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Ruangan</Label>
          <select value={ruanganId} onChange={(e) => setRuanganId(e.target.value)} className={inputCls}>
            <option value="">Semua ruangan</option>
            {ruangan.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Bidang</Label>
          <select value={bidangId} onChange={(e) => setBidangId(e.target.value)} className={inputCls}>
            <option value="">Semua bidang</option>
            {bidang.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nama}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="pt-3">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a href={buildUrl()}>
            <Download className="h-4 w-4" />
            Unduh laporan
          </a>
        </Button>
      </div>
    </div>
  );
}
