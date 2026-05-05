"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type Bidang = { id: string; nama: string; kode: string | null };

export function LoginPemohonForm({ bidang }: { bidang: Bidang[] }) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [bidangId, setBidangId] = useState(bidang[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return toast.error("Nama wajib diisi");
    if (!bidangId) return toast.error("Pilih bidang");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/pemohon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaLengkap: nama.trim(), bidangId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Login gagal");
        setBusy(false);
        return;
      }
      router.replace(data.redirect ?? "/pemohon");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan");
      setBusy(false);
    }
  };

  if (bidang.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Daftar bidang masih kosong. Hubungi admin untuk mengisi data bidang
        terlebih dahulu, atau jalankan endpoint <code>/api/seed</code>.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="nama">Nama Lengkap</Label>
        <Input
          id="nama"
          autoFocus
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Mis. Sayo Pratama"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="bidang">Bidang / Unit Kerja</Label>
        <select
          id="bidang"
          value={bidangId}
          onChange={(e) => setBidangId(e.target.value)}
          className="mt-1.5 flex h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-300/40"
        >
          {bidang.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nama}
              {b.kode ? ` · ${b.kode}` : ""}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? "Memproses…" : "Lanjut"}
      </Button>
    </form>
  );
}
