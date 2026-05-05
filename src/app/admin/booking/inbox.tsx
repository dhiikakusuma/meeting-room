"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { formatTanggal } from "@/lib/datetime";

type Item = {
  id: string;
  agenda: string;
  pemohonNama: string;
  bidangNama: string;
  ruanganNama: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  jumlahPeserta: number;
  createdAt: string;
};

export function BookingInboxAdmin({ items }: { items: Item[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<null | "APPROVE" | "REJECT">(null);
  const [bulkCatatan, setBulkCatatan] = useState("");
  const [busy, setBusy] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Inbox kosong"
        description="Tidak ada pengajuan baru yang perlu disetujui."
      />
    );
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }

  async function executeBulk() {
    if (!bulkAction || selected.size === 0) return;
    setBusy(true);
    const res = await fetch("/api/booking/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: Array.from(selected),
        action: bulkAction,
        catatan: bulkCatatan.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal melakukan aksi massal");
      setBusy(false);
      return;
    }
    const okCount = (data.success ?? []).length;
    const skipCount = (data.skipped ?? []).length;
    toast.success(
      `${okCount} berhasil${skipCount > 0 ? `, ${skipCount} dilewati (bentrok/status berubah)` : ""}.`,
    );
    setSelected(new Set());
    setBulkAction(null);
    setBulkCatatan("");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-ink-100 bg-white p-3 flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size === items.length && items.length > 0}
            onChange={toggleAll}
            className="h-4 w-4 accent-gold-500"
          />
          {selected.size === 0 ? "Pilih semua" : `${selected.size} dipilih`}
        </label>
        <div className="flex-1" />
        {selected.size > 0 && (
          <>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkAction("REJECT")}
            >
              <X className="h-3.5 w-3.5" />
              Tolak ({selected.size})
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setBulkAction("APPROVE")}
            >
              <Check className="h-3.5 w-3.5" />
              Setujui ({selected.size})
            </Button>
          </>
        )}
      </div>

      <div className="space-y-2">
        {items.map((b) => {
          const checked = selected.has(b.id);
          return (
            <div
              key={b.id}
              className={`flex items-center gap-3 rounded-2xl border bg-white p-4 transition-colors ${
                checked ? "border-gold-300 ring-1 ring-gold-200" : "border-ink-100"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(b.id)}
                className="h-4 w-4 accent-gold-500"
                aria-label={`Pilih ${b.agenda}`}
              />
              <Link href={`/admin/booking/${b.id}`} className="flex-1 min-w-0">
                <p className="serif text-sm font-semibold text-ink-900 truncate">
                  {b.agenda}
                </p>
                <p className="text-[11.5px] text-ink-500 mt-0.5 nums">
                  {b.pemohonNama} · {b.bidangNama}
                </p>
                <p className="text-[11.5px] text-ink-500 nums">
                  {formatTanggal(b.tanggal)} · {b.jamMulai}–{b.jamSelesai} · {b.ruanganNama} ({b.jumlahPeserta} org)
                </p>
              </Link>
              <ChevronRight className="h-4 w-4 text-ink-400" />
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={bulkAction !== null}
        onOpenChange={(o) => {
          if (!o) {
            setBulkAction(null);
            setBulkCatatan("");
          }
        }}
        title={bulkAction === "APPROVE" ? "Setujui pengajuan terpilih?" : "Tolak pengajuan terpilih?"}
        description={
          bulkAction === "APPROVE"
            ? `${selected.size} pengajuan akan diteruskan ke atasan untuk persetujuan akhir.`
            : `${selected.size} pengajuan akan ditolak. Alasan akan dilihat pemohon.`
        }
        confirmText={busy ? "Memproses…" : bulkAction === "APPROVE" ? "Ya, teruskan" : "Ya, tolak"}
        destructive={bulkAction === "REJECT"}
        onConfirm={executeBulk}
      />

      {bulkAction === "REJECT" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-md">
          <div className="rounded-2xl bg-white border border-ink-100 shadow-xl p-4">
            <p className="text-[11px] tracking-[0.16em] uppercase text-ink-500 serif mb-2">
              Alasan Penolakan (wajib)
            </p>
            <Textarea
              value={bulkCatatan}
              onChange={(e) => setBulkCatatan(e.target.value)}
              rows={2}
              placeholder="Mis. Slot bentrok dengan acara lain"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBulkAction(null);
                  setBulkCatatan("");
                }}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={executeBulk}
                disabled={busy || bulkCatatan.trim().length < 3}
              >
                {busy ? "Memproses…" : "Konfirmasi tolak"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
