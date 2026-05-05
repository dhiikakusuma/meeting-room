import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatTanggalLong } from "./datetime";

export type BookingPdfData = {
  nomorSurat: string;
  pemohonNama: string;
  bidangNama: string;
  ruanganNama: string;
  ruanganLantai?: string | null;
  tanggal: Date;
  jamMulai: string;
  jamSelesai: string;
  agenda: string;
  jumlahPeserta: number;
  kebutuhan: string[];
  catatanAdmin?: string | null;
  catatanAtasan?: string | null;
  adminNama?: string | null;
  atasanNama?: string | null;
  atasanJabatan?: string | null;
  approvedAtasanAt?: Date | null;
  pemohonTtdUrl?: string | null;
  atasanTtdUrl?: string | null;
};

const INK = [15, 23, 42] as const;
const MUTED = [90, 101, 122] as const;

export async function generateBookingPdf(data: BookingPdfData): Promise<Buffer> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;
  let y = margin;

  // Kop surat
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text("PEMERINTAH KOTA BALIKPAPAN", pageWidth / 2, y + 12, { align: "center" });
  y += 28;
  doc.setFontSize(11);
  doc.text("DINAS PEMBERDAYAAN PEREMPUAN, PERLINDUNGAN ANAK,", pageWidth / 2, y, {
    align: "center",
  });
  y += 14;
  doc.text("DAN KELUARGA BERENCANA", pageWidth / 2, y, { align: "center" });
  y += 16;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(
    "Jl. Marsma R. Iswahyudi, Sepinggan, Kota Balikpapan — Kalimantan Timur",
    pageWidth / 2,
    y,
    { align: "center" },
  );
  y += 18;

  // Divider hitam (single line, kop surat resmi style)
  doc.setDrawColor(...INK);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text("SURAT PEMINJAMAN RUANG RAPAT", pageWidth / 2, y, { align: "center" });
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nomor: ${data.nomorSurat}`, pageWidth / 2, y, { align: "center" });
  y += 24;

  // Body opening
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text("Dengan ini diberitahukan bahwa peminjaman ruang rapat berikut telah", margin, y);
  y += 14;
  doc.text("DISETUJUI dan dapat dipergunakan sesuai jadwal di bawah ini:", margin, y);
  y += 16;

  // Detail table
  const detailRows: Array<[string, string]> = [
    ["Nama Pemohon", data.pemohonNama],
    ["Bidang / Unit Kerja", data.bidangNama],
    [
      "Ruangan",
      `${data.ruanganNama}${data.ruanganLantai ? ` · ${data.ruanganLantai}` : ""}`,
    ],
    ["Tanggal", formatTanggalLong(data.tanggal)],
    ["Waktu", `${data.jamMulai} – ${data.jamSelesai} WITA`],
    ["Jumlah Peserta", `${data.jumlahPeserta} orang`],
    ["Agenda", data.agenda],
  ];
  if (data.kebutuhan.length) {
    detailRows.push(["Kebutuhan Tambahan", data.kebutuhan.join(", ")]);
  }
  if (data.catatanAdmin) detailRows.push(["Catatan Admin", data.catatanAdmin]);
  if (data.catatanAtasan) detailRows.push(["Catatan Atasan", data.catatanAtasan]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: detailRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 10.5,
      cellPadding: { top: 4, bottom: 4, left: 0, right: 6 },
      textColor: [...INK],
      lineWidth: 0,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 150, textColor: [...INK] },
      1: { cellWidth: "auto", textColor: [...INK] },
    },
    didDrawCell: (cellData) => {
      if (cellData.column.index === 0) {
        doc.setTextColor(...INK);
      }
    },
  });

  // @ts-expect-error lastAutoTable injected by autoTable
  y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 16 : y + 200;

  // Penutup
  doc.setFontSize(10.5);
  doc.text(
    "Surat ini berlaku sebagai bukti resmi peminjaman dan dapat ditunjukkan",
    margin,
    y,
  );
  y += 14;
  doc.text(
    "kepada petugas keamanan / penanggung jawab ruangan saat hari pelaksanaan.",
    margin,
    y,
  );
  y += 28;

  // Tanda tangan section: Pemohon (kiri) & Atasan (kanan)
  const tanggalSurat = data.approvedAtasanAt ?? new Date();
  const innerWidth = pageWidth - margin * 2;
  const colWidth = innerWidth / 2;
  const leftX = margin;
  const rightX = margin + colWidth;
  const sigBoxWidth = 180;
  const sigBoxHeight = 64;

  // Heading kanan: "Balikpapan, <tanggal>" + jabatan atasan
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(`Balikpapan, ${formatTanggalLong(tanggalSurat)}`, rightX, y);
  doc.text(data.atasanJabatan || "Kepala Dinas", rightX, y + 14);

  // Heading kiri: "Pemohon"
  doc.text("Pemohon,", leftX, y);

  const sigYStart = y + 22;

  // Render gambar tanda tangan jika ada
  if (data.pemohonTtdUrl) {
    try {
      doc.addImage(
        data.pemohonTtdUrl,
        "PNG",
        leftX,
        sigYStart,
        sigBoxWidth,
        sigBoxHeight,
      );
    } catch {
      // ignore image render failure
    }
  }
  if (data.atasanTtdUrl) {
    try {
      doc.addImage(
        data.atasanTtdUrl,
        "PNG",
        rightX,
        sigYStart,
        sigBoxWidth,
        sigBoxHeight,
      );
    } catch {
      // ignore image render failure
    }
  }

  // Garis tanda tangan + nama
  const nameY = sigYStart + sigBoxHeight + 4;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(`( ${data.pemohonNama} )`, leftX, nameY);
  doc.text(`( ${data.atasanNama ?? "-"} )`, rightX, nameY);
  doc.setFont("helvetica", "normal");

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const footerY = doc.internal.pageSize.getHeight() - 32;
  doc.text(
    "Dokumen ini diterbitkan otomatis oleh sistem Booking Ruang Rapat DP3AKB Kota Balikpapan.",
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
