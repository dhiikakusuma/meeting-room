"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type Initial = {
  namaLengkap: string;
  jabatan: string;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [namaLengkap, setNamaLengkap] = useState(initial.namaLengkap);
  const [jabatan, setJabatan] = useState(initial.jabatan);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!namaLengkap.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        namaLengkap: namaLengkap.trim(),
        jabatan: jabatan.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal menyimpan");
      setBusy(false);
      return;
    }
    toast.success("Profil tersimpan");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="namaLengkap">Nama lengkap</Label>
        <Input
          id="namaLengkap"
          value={namaLengkap}
          onChange={(e) => setNamaLengkap(e.target.value)}
          placeholder="Contoh: Drs. H. Suherman, M.Si"
        />
        <p className="text-[11px] text-ink-500">
          Nama ini juga otomatis dipakai sebagai default tanda tangan saat menyetujui.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jabatan">Jabatan</Label>
        <Input
          id="jabatan"
          value={jabatan}
          onChange={(e) => setJabatan(e.target.value)}
          placeholder="Contoh: Kepala Dinas DP3AKB"
        />
        <p className="text-[11px] text-ink-500">
          Akan ditampilkan di blok tanda tangan kanan pada surat resmi PDF.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}
