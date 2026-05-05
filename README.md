# Servis Kendaraan — DP3AKB Kota Balikpapan

Aplikasi web pengajuan service kendaraan dinas untuk **Dinas Pemberdayaan Perempuan, Perlindungan Anak, dan Keluarga Berencana Kota Balikpapan**. Dibangun ulang dari nol dengan UI yang lebih elegan dan modern, mengikuti workflow:

> Pemohon login → buat pengajuan → kasubag review → tanda tangan digital → generate PDF → pemohon unduh & bawa ke rekanan.

## Fitur Utama

### Pemohon
- Login dengan **nama lengkap** (akun otomatis dibuat jika belum ada)
- Form pengajuan dengan pilihan kendaraan terdaftar atau input plat nomor manual
- **Tanda tangan digital canvas** (bukan sekadar nama terang)
- Status pengajuan real-time (Menunggu / Disetujui / Ditolak)
- Unduh surat pengantar PDF untuk pengajuan yang disetujui
- Riwayat pengajuan

### Kasubag / Admin
- Login dengan password (`admin123`)
- Dashboard ringkasan jumlah pengajuan per status
- Inbox pengajuan dengan filter tab (Menunggu / Disetujui / Ditolak)
- **Setujui dengan tanda tangan digital canvas** → surat PDF siap cetak
- Tolak dengan alasan jelas
- Manajemen master data kendaraan (tambah/hapus)
- Export data pengajuan ke CSV
- Audit log otomatis untuk setiap aksi

### Surat PDF
- Kop surat resmi DP3AKB
- Nomor surat otomatis (format `001/SPS/DP3AKB/2026`)
- Tabel detail pengajuan + kendaraan
- Tanda tangan digital pemohon & kasubag tercetak sebagai gambar

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, **TypeScript 5**
- **Tailwind CSS 4** + custom design tokens (brand `emerald`)
- **Radix UI** primitives + komponen shadcn-style handwritten
- **Prisma 7** + **SQLite** (zero-config lokal)
- **jsPDF** + **jspdf-autotable** untuk generate surat
- **signature_pad** untuk canvas tanda tangan
- **bcryptjs** untuk hash password kasubag
- **sonner** untuk toast
- **Zustand** disiapkan untuk state client (saat ini UI pakai server component + form biasa)

## Jalankan Lokal

```bash
# 1. Install dependencies
bun install

# 2. Inisialisasi database SQLite
bunx prisma migrate dev

# 3. Jalankan dev server
bun run dev

# 4. Seed data awal (sekali saja)
curl http://localhost:3000/api/seed
```

Buka [http://localhost:3000](http://localhost:3000).

## Kredensial Default (Setelah Seed)

| Role       | Login                              |
| ---------- | ---------------------------------- |
| Kasubag    | Password: `admin123`               |
| Admin      | Password: `admin123`               |
| Pemohon    | Nama: `Budi Santoso`, `Siti Rahayu`, `Ahmad Hidayat` (atau nama baru apa saja) |

## Struktur Project

```
src/
├── app/
│   ├── api/
│   │   ├── auth/{pemohon,kasubag,logout}/route.ts
│   │   ├── pengajuan/{route,[id]/{approve,reject}}.ts
│   │   ├── kendaraan/{route,[id]}/route.ts
│   │   ├── me/route.ts
│   │   └── seed/route.ts
│   ├── login/{pemohon,kasubag}/page.tsx
│   ├── pemohon/
│   │   ├── page.tsx                       # Dashboard
│   │   ├── pengajuan/baru/page.tsx        # Form pengajuan
│   │   ├── pengajuan/[id]/page.tsx        # Detail
│   │   └── riwayat/page.tsx
│   ├── kasubag/
│   │   ├── page.tsx                       # Dashboard
│   │   ├── pengajuan/page.tsx             # Inbox (tab filter)
│   │   ├── pengajuan/[id]/page.tsx        # Detail + approve/reject
│   │   ├── riwayat/page.tsx
│   │   ├── kendaraan/page.tsx             # Manajemen kendaraan
│   │   └── export/page.tsx                # Export CSV
│   ├── layout.tsx
│   └── page.tsx                           # Landing
├── components/
│   ├── app-shell.tsx                      # Sidebar + topbar layout
│   ├── pengajuan-detail-view.tsx          # Detail + approve/reject flow
│   ├── kendaraan-manager.tsx
│   ├── logo.tsx
│   ├── status-badge.tsx
│   └── ui/{button,card,input,textarea,label,badge,toast,signature-pad}.tsx
└── lib/
    ├── auth.ts                            # Cookie session
    ├── prisma.ts                          # Prisma client singleton
    ├── pdf-generator.ts                   # jsPDF surat pengantar
    └── utils.ts
prisma/
└── schema.prisma                          # User, Kendaraan, Pengajuan, AuditLog
```

## Deployment

### Vercel
1. Push ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Set `DATABASE_URL` (untuk production pakai Postgres/MySQL — SQLite tidak cocok di Vercel)
4. Jalankan `prisma migrate deploy` pada build command

### Self-host (VPS)
```bash
bun run build
bun run start
```

## Roadmap

- [ ] Notifikasi email ke pemohon saat pengajuan disetujui/ditolak
- [ ] QR code verifikasi pada surat PDF
- [ ] Dark mode toggle
- [ ] Rekap bulanan otomatis
- [ ] Integrasi dengan daftar bengkel rekanan

## Lisensi

MIT.
