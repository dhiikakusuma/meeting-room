"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "@/components/ui/toast";

type Ruangan = {
  id: string;
  nama: string;
  lantai: string | null;
  kapasitas: number;
  fasilitas: string[];
  fotoUrl: string | null;
  aktif: boolean;
};

const FASILITAS_OPSI = ["Proyektor", "AC", "Whiteboard", "Sound System", "WiFi", "Microphone", "TV"];

export function RuanganManager({ initial }: { initial: Ruangan[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Ruangan | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Ruangan | null>(null);

  async function save(data: Partial<Ruangan> & { id?: string }) {
    const isNew = !data.id;
    const url = isNew ? "/api/ruangan" : `/api/ruangan/${data.id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: data.nama,
        lantai: data.lantai,
        kapasitas: data.kapasitas,
        fasilitas: data.fasilitas,
        fotoUrl: data.fotoUrl,
        aktif: data.aktif,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Gagal menyimpan");
      return false;
    }
    toast.success(isNew ? "Ruangan ditambahkan" : "Ruangan diperbarui");
    if (isNew) setItems((arr) => [...arr, json.item]);
    else setItems((arr) => arr.map((r) => (r.id === json.item.id ? json.item : r)));
    setEditing(null);
    setAdding(false);
    router.refresh();
    return true;
  }

  async function remove(r: Ruangan) {
    const res = await fetch(`/api/ruangan/${r.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Gagal");
      return;
    }
    if (json.softDeleted) {
      toast.success(json.message ?? "Ruangan dinonaktifkan");
      setItems((arr) =>
        arr.map((x) => (x.id === r.id ? { ...x, aktif: false } : x)),
      );
    } else {
      toast.success("Ruangan dihapus");
      setItems((arr) => arr.filter((x) => x.id !== r.id));
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Tambah Ruangan
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((r) => (
          <div
            key={r.id}
            className={`rounded-2xl border bg-white overflow-hidden ${r.aktif ? "border-ink-100" : "border-ink-200 opacity-70"}`}
          >
            <div
              className="h-32 bg-cover bg-center"
              style={{ backgroundImage: `url(${r.fotoUrl || "/dp3akb-room.jpg"})` }}
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="serif text-sm font-semibold text-ink-900 truncate">{r.nama}</p>
                  <p className="text-[11px] text-ink-500">
                    {r.lantai ?? "—"} · {r.kapasitas} orang
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    r.aktif
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-ink-100 border border-ink-200 text-ink-500"
                  }`}
                >
                  {r.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              {r.fasilitas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.fasilitas.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-ink-200 px-2 py-0.5 text-[10.5px] text-ink-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDel(r)}>
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(adding || editing) && (
        <RuanganForm
          initial={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSave={save}
        />
      )}

      <ConfirmDialog
        open={confirmDel !== null}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title={`Hapus ruangan "${confirmDel?.nama ?? ""}"?`}
        description="Jika ruangan sudah memiliki riwayat booking, sistem otomatis menonaktifkannya alih-alih menghapus."
        confirmText="Ya, hapus"
        requireType="HAPUS"
        onConfirm={async () => {
          if (confirmDel) await remove(confirmDel);
        }}
      />
    </div>
  );
}

function RuanganForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Ruangan | null;
  onClose: () => void;
  onSave: (data: Partial<Ruangan> & { id?: string }) => Promise<boolean>;
}) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [lantai, setLantai] = useState(initial?.lantai ?? "");
  const [kapasitas, setKapasitas] = useState(initial?.kapasitas ?? 25);
  const [fasilitas, setFasilitas] = useState<string[]>(initial?.fasilitas ?? []);
  const [aktif, setAktif] = useState(initial?.aktif ?? true);
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="serif text-lg font-semibold text-ink-900">
            {initial ? "Edit Ruangan" : "Tambah Ruangan"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-cream-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="r-nama">Nama ruangan</Label>
            <Input id="r-nama" value={nama} onChange={(e) => setNama(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="r-lantai">Lantai</Label>
              <Input id="r-lantai" value={lantai} onChange={(e) => setLantai(e.target.value)} placeholder="Mis. Lantai 2" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="r-kap">Kapasitas</Label>
              <Input
                id="r-kap"
                type="number"
                value={kapasitas}
                onChange={(e) => setKapasitas(Number(e.target.value))}
                className="mt-1 nums"
              />
            </div>
          </div>
          <div>
            <Label>Fasilitas</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {FASILITAS_OPSI.map((f) => {
                const active = fasilitas.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() =>
                      setFasilitas((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]))
                    }
                    className={`text-[12px] px-3 py-1 rounded-full border ${
                      active
                        ? "bg-ink-900 text-cream-50 border-ink-900"
                        : "bg-white text-ink-700 border-ink-200"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={aktif}
              onChange={(e) => setAktif(e.target.checked)}
              className="h-4 w-4 accent-gold-500"
            />
            Aktif (tampil di form pemohon)
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button
            onClick={async () => {
              setBusy(true);
              const ok = await onSave({
                id: initial?.id,
                nama: nama.trim(),
                lantai: lantai.trim() || null,
                kapasitas,
                fasilitas,
                aktif,
              });
              if (!ok) setBusy(false);
            }}
            disabled={busy || !nama.trim()}
          >
            <Save className="h-3.5 w-3.5" />
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
