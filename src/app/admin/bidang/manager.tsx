"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "@/components/ui/toast";

type Item = {
  id: string;
  nama: string;
  kode: string | null;
  aktif: boolean;
  urutan: number;
  jumlahPemohon: number;
};

export function BidangManager({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Item | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Item | null>(null);

  async function reorder(newOrder: Item[]) {
    setItems(newOrder);
    await fetch("/api/bidang/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newOrder.map((i) => i.id) }),
    });
  }
  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    void reorder(next);
  }
  function moveDown(idx: number) {
    if (idx === items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    void reorder(next);
  }

  async function save(data: { id?: string; nama: string; kode?: string | null; aktif?: boolean }) {
    const isNew = !data.id;
    const url = isNew ? "/api/bidang" : `/api/bidang/${data.id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Gagal");
      return false;
    }
    toast.success(isNew ? "Bidang ditambahkan" : "Bidang diperbarui");
    if (isNew) {
      setItems((arr) => [...arr, { ...json.item, jumlahPemohon: 0 }]);
    } else {
      setItems((arr) => arr.map((b) => (b.id === json.item.id ? { ...b, ...json.item } : b)));
    }
    setEditing(null);
    setAdding(false);
    router.refresh();
    return true;
  }

  async function toggleAktif(b: Item) {
    await save({ id: b.id, nama: b.nama, kode: b.kode, aktif: !b.aktif });
  }

  async function remove(b: Item) {
    const res = await fetch(`/api/bidang/${b.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Gagal");
      return;
    }
    if (json.softDeleted) {
      toast.success(json.message ?? "Bidang dinonaktifkan");
      setItems((arr) => arr.map((x) => (x.id === b.id ? { ...x, aktif: false } : x)));
    } else {
      toast.success("Bidang dihapus");
      setItems((arr) => arr.filter((x) => x.id !== b.id));
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Tambah Bidang
        </Button>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white divide-y divide-ink-100">
        {items.map((b, idx) => (
          <div
            key={b.id}
            className={`flex items-center gap-3 p-3 ${b.aktif ? "" : "opacity-60"}`}
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                aria-label="Naik"
                className="p-1 rounded hover:bg-cream-100 disabled:opacity-40"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === items.length - 1}
                aria-label="Turun"
                className="p-1 rounded hover:bg-cream-100 disabled:opacity-40"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="serif text-sm font-semibold text-ink-900">{b.nama}</p>
              <p className="text-[11px] text-ink-500 nums">
                {b.kode ? `${b.kode} · ` : ""}
                {b.jumlahPemohon} pemohon
              </p>
            </div>
            <button
              onClick={() => toggleAktif(b)}
              className={`text-[10px] px-2 py-1 rounded-full border ${
                b.aktif
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-ink-100 border-ink-200 text-ink-500"
              }`}
            >
              {b.aktif ? "Aktif" : "Nonaktif"}
            </button>
            <button
              onClick={() => setEditing(b)}
              aria-label="Edit"
              className="p-1.5 rounded-md hover:bg-cream-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDel(b)}
              aria-label="Hapus"
              className="p-1.5 rounded-md hover:bg-rose-50 text-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="p-6 text-center text-sm text-ink-500">Belum ada bidang.</p>
        )}
      </div>

      {(adding || editing) && (
        <BidangForm
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
        title={`Hapus bidang "${confirmDel?.nama ?? ""}"?`}
        description="Jika sudah ada pemohon/booking, sistem otomatis menonaktifkan alih-alih menghapus."
        confirmText="Ya, hapus"
        requireType="HAPUS"
        onConfirm={async () => {
          if (confirmDel) await remove(confirmDel);
        }}
      />
    </div>
  );
}

function BidangForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Item | null;
  onClose: () => void;
  onSave: (data: { id?: string; nama: string; kode?: string | null; aktif?: boolean }) => Promise<boolean>;
}) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [kode, setKode] = useState(initial?.kode ?? "");
  const [aktif, setAktif] = useState(initial?.aktif ?? true);
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="serif text-lg font-semibold text-ink-900">
            {initial ? "Edit Bidang" : "Tambah Bidang"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-cream-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="b-nama">Nama bidang</Label>
            <Input id="b-nama" value={nama} onChange={(e) => setNama(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="b-kode">Kode singkatan (opsional)</Label>
            <Input id="b-kode" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Mis. SBU, KB" className="mt-1" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={aktif}
              onChange={(e) => setAktif(e.target.checked)}
              className="h-4 w-4 accent-gold-500"
            />
            Aktif (muncul di login pemohon)
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
                kode: kode.trim() || null,
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
