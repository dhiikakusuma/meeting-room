-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "jabatan" TEXT,
    "role" TEXT NOT NULL DEFAULT 'pemohon',
    "passwordHash" TEXT,
    "bidangId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bidang" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bidang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruangan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "lantai" TEXT,
    "kapasitas" INTEGER NOT NULL DEFAULT 20,
    "fasilitas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fotoUrl" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ruangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "nomorSurat" TEXT,
    "pemohonId" TEXT NOT NULL,
    "pemohonNama" TEXT NOT NULL,
    "bidangId" TEXT,
    "bidangNama" TEXT NOT NULL,
    "ruanganId" TEXT NOT NULL,
    "ruanganNama" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "jumlahPeserta" INTEGER NOT NULL DEFAULT 0,
    "agenda" TEXT NOT NULL,
    "kebutuhan" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU_ADMIN',
    "catatanAdmin" TEXT,
    "catatanAtasan" TEXT,
    "adminId" TEXT,
    "adminNama" TEXT,
    "atasanId" TEXT,
    "atasanNama" TEXT,
    "atasanJabatan" TEXT,
    "seriesId" TEXT,
    "seriesIndex" INTEGER,
    "seriesTotal" INTEGER,
    "seriesFrequency" TEXT,
    "approvedAdminAt" TIMESTAMP(3),
    "approvedAtasanAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nomor_surat_counter" (
    "id" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "bulan" INTEGER NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nomor_surat_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_namaLengkap_idx" ON "users"("namaLengkap");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_nomorSurat_key" ON "bookings"("nomorSurat");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_tanggal_idx" ON "bookings"("tanggal");

-- CreateIndex
CREATE INDEX "bookings_ruanganId_tanggal_idx" ON "bookings"("ruanganId", "tanggal");

-- CreateIndex
CREATE INDEX "bookings_pemohonId_idx" ON "bookings"("pemohonId");

-- CreateIndex
CREATE INDEX "bookings_seriesId_idx" ON "bookings"("seriesId");

-- CreateIndex
CREATE INDEX "audit_logs_bookingId_idx" ON "audit_logs"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "nomor_surat_counter_tahun_bulan_key" ON "nomor_surat_counter"("tahun", "bulan");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_bidangId_fkey" FOREIGN KEY ("bidangId") REFERENCES "bidang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pemohonId_fkey" FOREIGN KEY ("pemohonId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bidangId_fkey" FOREIGN KEY ("bidangId") REFERENCES "bidang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_ruanganId_fkey" FOREIGN KEY ("ruanganId") REFERENCES "ruangan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_atasanId_fkey" FOREIGN KEY ("atasanId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

