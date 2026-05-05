import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
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
  verifyUrl?: string;
};

const INK = [15, 23, 42] as const;
const GOLD = [201, 148, 31] as const;
const MUTED = [90, 101, 122] as const;

export async function generateBookingPdf(data: BookingPdfData): Promise<Buffer> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;
  let y = margin;

  // Top gold bar
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, pageWidth, 4, "F");

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

  // Divider gold
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setLineWidth(0.4);
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

  // Tanda tangan section
  const tanggalSurat = data.approvedAtasanAt ?? new Date();
  const ttdRightX = pageWidth - margin - 180;
  doc.text(`Balikpapan, ${formatTanggalLong(tanggalSurat)}`, ttdRightX, y);
  y += 14;
  doc.text(data.atasanJabatan || "Kepala Dinas", ttdRightX, y);
  y += 70;
  doc.setFont("helvetica", "bold");
  doc.text(`( ${data.atasanNama ?? "-"} )`, ttdRightX, y);
  doc.setFont("helvetica", "normal");
  y += 30;

  // QR Code (kiri bawah) untuk verifikasi
  if (data.verifyUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
        margin: 0,
        width: 200,
        errorCorrectionLevel: "M",
      });
      const qrSize = 90;
      const qrX = margin;
      const qrY = y - 110;
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text("Scan QR untuk verifikasi", qrX, qrY + qrSize + 12);
      doc.setFontSize(7);
      doc.text(data.verifyUrl, qrX, qrY + qrSize + 22, { maxWidth: 220 });
    } catch {
      // ignore QR failure
    }
  }

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
