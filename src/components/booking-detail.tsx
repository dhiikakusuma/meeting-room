"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users, MapPin, Download, X, Check, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad, type SignaturePadHandle } from "@/components/ui/signature-pad";
import { StatusBadge } from "./status-badge";
import { ConfirmDialog } from "./confirm-dialog";
import { toast } from "@/components/ui/toast";
import { formatTanggalLong, durationLabel } from "@/lib/datetime";
import { STATUS_LABELS } from "@/lib/booking-status";

export type BookingDetailData = {
  id: string;
  nomorSurat: string | null;
  pemohonNama: string;
  bidangNama: string;
  ruanganNama: string;
  tanggal: string | Date;
  jamMulai: string;
  jamSelesai: string;
  agenda: string;
  jumlahPeserta: number;
  kebutuhan: string[];
  status: string;
  catatanAdmin: string | null;
  catatanAtasan: string | null;
  adminNama: string | null;
  atasanNama: string | null;
  atasanJabatan: string | null;
  approvedAdminAt: string | Date | null;
  approvedAtasanAt: string | Date | null;
  rejectedAt: string | Date | null;
  cancelledAt: string | Date | null;
  createdAt: string | Date;
  seriesId: string | null;
  seriesIndex: number | null;
  seriesTotal: number | null;
  pemohonTtdUrl: string | null;
  atasanTtdUrl: string | null;
  ruangan: { lantai: string | null } | null;
  auditLogs: Array<{
    id: string;
    actorName: string;
    actorRole: string | null;
    action: string;
    detail: string | null;
    timestamp: string | Date;
  }>;
};

type Role = "pemohon" | "admin" | "atasan";

export function BookingDetail({
  booking,
  role,
  currentUserName,
}: {
  booking: BookingDetailData;
  role: Role;
  currentUserName?: string;
}) {
  const router = useRouter();
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const atasanSigRef = useRef<SignaturePadHandle>(null);
  const [atasanTtdUrl, setAtasanTtdUrl] = useState<string | null>(null);

  const tanggalDate = new Date(booking.tanggal);
  const canCancel =
    role === "pemohon" &&
    (booking.status === "MENUNGGU_ADMIN" || booking.status === "MENUNGGU_ATASAN");
  const canDownload = booking.status === "DISETUJUI" && booking.nomorSurat;

  const adminCanAct = role === "admin" && booking.status === "MENUNGGU_ADMIN";
  const atasanCanAct = role === "atasan" && booking.status === "MENUNGGU_ATASAN";

  async function approve() {
    const isAtasan = role === "atasan";
    let ttd: string | null = null;
    if (isAtasan) {
      ttd = atasanTtdUrl ?? atasanSigRef.current?.toDataURL() ?? null;
      if (!ttd || atasanSigRef.current?.isEmpty()) {
        toast.error("Tanda tangan atasan wajib diisi");
        return;
      }
    }
    setBusy(true);
    const url = role === "admin"
      ? `/api/booking/${booking.id}/approve-admin`
      : `/api/booking/${booking.id}/approve-atasan`;
    const payload: Record<string, unknown> = {
      catatan: catatan.trim() || null,
    };
    if (isAtasan) payload.atasanTtdUrl = ttd;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal menyetujui");
      setBusy(false);
      return;
    }
    toast.success("Booking disetujui");
    router.refresh();
  }

  async function reject() {
    if (!catatan.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/booking/${booking.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catatan: catatan.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal menolak");
      setBusy(false);
      return;
    }
    toast.success("Booking ditolak");
    router.refresh();
  }

  async function cancel() {
    const res = await fetch(`/api/booking/${booking.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Gagal membatalkan");
      return;
    }
    toast.success("Booking dibatalkan");
    router.refresh();
  }

  const timeline: Array<{ label: string; status: "done" | "active" | "pending" | "rejected" | "cancelled"; at?: string | Date | null }> = [
    {
      label: "Pengajuan dikirim",
      status: "done",
      at: booking.createdAt,
    },
    {
      label: "Disetujui Admin",
      status:
        booking.status === "MENUNGGU_ADMIN"
          ? "active"
          : booking.status === "DITOLAK_ADMIN"
            ? "rejected"
            : booking.status === "BATAL_PEMOHON" && !booking.approvedAdminAt
              ? "cancelled"
              : booking.approvedAdminAt
                ? "done"
                : "pending",
      at: booking.approvedAdminAt,
    },
    {
      label: "Disetujui Atasan",
      status:
        booking.status === "MENUNGGU_ATASAN"
          ? "active"
          : booking.status === "DITOLAK_ATASAN"
            ? "rejected"
            : booking.approvedAtasanAt
              ? "done"
              : "pending",
      at: booking.approvedAtasanAt,
    },
    {
      label: "Surat resmi terbit",
      status: booking.status === "DISETUJUI" ? "done" : "pending",
      at: booking.approvedAtasanAt,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] tracking-[0.16em] uppercase text-ink-500 serif">
            {booking.nomorSurat ?? "Belum ada nomor surat"}
          </p>
          <h1 className="serif text-2xl font-semibold text-ink-900 mt-1 max-w-xl">
            {booking.agenda}
          </h1>
          {booking.seriesId && (
            <p className="text-[11px] text-gold-700 mt-1">
              Bagian dari rapat berulang ({booking.seriesIndex}/{booking.seriesTotal})
            </p>
          )}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Detail card */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5 space-y-3">
        <Row icon={<Users className="h-4 w-4" />} label="Pemohon" value={`${booking.pemohonNama} · ${booking.bidangNama}`} />
        <Row icon={<MapPin className="h-4 w-4" />} label="Ruangan" value={`${booking.ruanganNama}${booking.ruangan?.lantai ? ` · ${booking.ruangan.lantai}` : ""}`} />
        <Row icon={<Calendar className="h-4 w-4" />} label="Tanggal" value={formatTanggalLong(tanggalDate)} />
        <Row icon={<Clock className="h-4 w-4" />} label="Waktu" value={`${booking.jamMulai} – ${booking.jamSelesai} (${durationLabel(booking.jamMulai, booking.jamSelesai)})`} />
        <Row icon={<Users className="h-4 w-4" />} label="Peserta" value={`${booking.jumlahPeserta} orang`} />
        {booking.kebutuhan.length > 0 && (
          <Row label="Kebutuhan" value={booking.kebutuhan.join(", ")} />
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <p className="text-[11px] tracking-[0.16em] uppercase text-gold-700 serif mb-3">
          Status Persetujuan
        </p>
        <ol className="space-y-3 ml-1">
          {timeline.map((step, i) => {
            const isLast = i === timeline.length - 1;
            const dot =
              step.status === "done"
                ? "bg-emerald-500 border-emerald-500"
                : step.status === "rejected"
                  ? "bg-rose-500 border-rose-500"
                  : step.status === "cancelled"
                    ? "bg-slate-400 border-slate-400"
                    : step.status === "active"
                      ? "bg-amber-400 border-amber-400 animate-pulse"
                      : "bg-white border-ink-200";
            return (
              <li key={step.label} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <span className={`h-3 w-3 rounded-full border-2 ${dot} relative z-10`} />
                  {!isLast && <span className="flex-1 w-px bg-gradient-to-b from-gold-300/50 to-transparent" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm text-ink-900">{step.label}</p>
                  {step.at && (
                    <p className="text-[11px] text-ink-500 nums">
                      {new Date(step.at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Catatan admin / atasan (if any) */}
      {(booking.catatanAdmin || booking.catatanAtasan) && (
        <div className="rounded-2xl border border-ink-100 bg-white p-5 space-y-3">
          {booking.catatanAdmin && (
            <Note
              from={`Admin · ${booking.adminNama ?? "—"}`}
              text={booking.catatanAdmin}
              tone={booking.status === "DITOLAK_ADMIN" ? "danger" : "neutral"}
            />
          )}
          {booking.catatanAtasan && (
            <Note
              from={`Atasan · ${booking.atasanNama ?? "—"}`}
              text={booking.catatanAtasan}
              tone={booking.status === "DITOLAK_ATASAN" ? "danger" : "gold"}
            />
          )}
        </div>
      )}

      {/* Action panel */}
      {(adminCanAct || atasanCanAct) && (
        <div className="rounded-2xl border border-ink-100 bg-white p-5 space-y-3">
          <p className="text-[11px] tracking-[0.16em] uppercase text-gold-700 serif">
            {adminCanAct ? "Persetujuan Admin" : "Persetujuan Atasan"}
          </p>
          <Textarea
            placeholder={
              adminCanAct
                ? "Catatan admin (opsional jika setuju, wajib jika tolak)"
                : "Catatan atasan (opsional jika setuju, wajib jika tolak)"
            }
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
          />
          {atasanCanAct && (
            <SignaturePad
              ref={atasanSigRef}
              label="Tanda tangan atasan"
              hint="Ketik nama lengkap — sistem otomatis merender sebagai tanda tangan."
              defaultName={currentUserName}
              onChange={setAtasanTtdUrl}
            />
          )}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="destructive" disabled={busy} onClick={reject}>
              <X className="h-4 w-4" />
              Tolak
            </Button>
            <Button
              variant={atasanCanAct ? "gold" : "default"}
              disabled={busy}
              onClick={approve}
            >
              <Check className="h-4 w-4" />
              {atasanCanAct ? "Setujui & Terbitkan Surat" : "Teruskan ke Atasan"}
            </Button>
          </div>
        </div>
      )}

      {/* Signatures preview (after approval) */}
      {(booking.pemohonTtdUrl || booking.atasanTtdUrl) && (
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="text-[11px] tracking-[0.16em] uppercase text-gold-700 serif mb-3">
            Tanda Tangan
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SignatureBlock
              title="Pemohon"
              name={booking.pemohonNama}
              dataUrl={booking.pemohonTtdUrl}
            />
            <SignatureBlock
              title={booking.atasanJabatan ?? "Atasan"}
              name={booking.atasanNama ?? "—"}
              dataUrl={booking.atasanTtdUrl}
            />
          </div>
        </div>
      )}

      {/* Pemohon actions */}
      {role === "pemohon" && (
        <div className="flex flex-wrap gap-2 justify-end">
          {canCancel && (
            <Button variant="ghost" onClick={() => setConfirmCancel(true)}>
              Batalkan booking
            </Button>
          )}
          {canDownload && (
            <Button variant="gold" asChild>
              <a href={`/api/booking/${booking.id}/pdf`} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
                Unduh Surat PDF
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Audit log */}
      {booking.auditLogs.length > 0 && (
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="text-[11px] tracking-[0.16em] uppercase text-gold-700 serif flex items-center gap-2 mb-3">
            <History className="h-3.5 w-3.5" /> Riwayat Aktivitas
          </p>
          <ul className="space-y-2">
            {booking.auditLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-start gap-3 text-[12px] border-b border-ink-100 last:border-b-0 pb-2 last:pb-0"
              >
                <span className="serif text-ink-900 font-medium min-w-[120px] truncate">
                  {log.actorName}
                </span>
                <span className="text-ink-500 flex-1">
                  <strong className="text-ink-700 mr-1">{log.action}</strong>
                  {log.detail && `· ${log.detail}`}
                </span>
                <span className="text-[10.5px] text-ink-400 nums whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString("id-ID", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Batalkan booking?"
        description="Booking yang sudah dibatalkan tidak bisa dipulihkan. Anda perlu mengajukan ulang."
        confirmText="Ya, batalkan"
        cancelText="Tidak"
        destructive
        onConfirm={cancel}
      />
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gold-700 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] text-ink-500 uppercase tracking-[0.14em]">{label}</p>
        <p className="text-sm text-ink-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function Note({
  from,
  text,
  tone,
}: {
  from: string;
  text: string;
  tone: "neutral" | "gold" | "danger";
}) {
  const cls =
    tone === "gold"
      ? "border-gold-200 bg-gold-50"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50"
        : "border-ink-200 bg-cream-50";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <p className="text-[10.5px] tracking-[0.14em] uppercase text-ink-500 serif">
        {from}
      </p>
      <p className="serif italic text-sm text-ink-900 mt-1">&ldquo;{text}&rdquo;</p>
    </div>
  );
}

function SignatureBlock({
  title,
  name,
  dataUrl,
}: {
  title: string;
  name: string;
  dataUrl: string | null;
}) {
  return (
    <div className="rounded-xl border border-ink-100 p-4 bg-cream-50/40">
      <p className="text-[10.5px] tracking-[0.14em] uppercase text-ink-500 serif">
        {title}
      </p>
      <div className="mt-2 h-24 flex items-center justify-center bg-white rounded-md border border-ink-100">
        {dataUrl ? (
          <Image
            src={dataUrl}
            alt={`Tanda tangan ${title}`}
            width={200}
            height={80}
            className="max-h-20 w-auto object-contain"
            unoptimized
          />
        ) : (
          <span className="text-[11px] italic text-ink-400 serif">Belum ditandatangani</span>
        )}
      </div>
      <p className="serif text-sm text-ink-900 mt-2 text-center">{name}</p>
    </div>
  );
}

// Suppress unused warning for STATUS_LABELS (used elsewhere)
void STATUS_LABELS;
