-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nip" TEXT,
    "namaLengkap" TEXT NOT NULL,
    "unitKerja" TEXT,
    "jabatan" TEXT,
    "role" TEXT NOT NULL DEFAULT 'pemohon',
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kendaraan" (
    "id" TEXT NOT NULL,
    "platNomor" TEXT NOT NULL,
    "merkModel" TEXT NOT NULL,
    "jenisKendaraan" TEXT NOT NULL DEFAULT 'Motor',
    "namaPengguna" TEXT,
    "tahunPembelian" INTEGER,
    "statusKendaraan" TEXT NOT NULL DEFAULT 'aktif',
    "lastServiceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kendaraan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengajuan" (
    "id" TEXT NOT NULL,
    "nomorSurat" TEXT,
    "userId" TEXT NOT NULL,
    "kendaraanId" TEXT NOT NULL,
    "detailKerusakan" TEXT NOT NULL,
    "tanggalRencana" TIMESTAMP(3) NOT NULL,
    "rekananNama" TEXT,
    "status" TEXT NOT NULL DEFAULT 'menunggu',
    "ttdPemohon" TEXT,
    "ttdKasubag" TEXT,
    "alasanPenolakan" TEXT,
    "tanggalPengajuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalPutusan" TIMESTAMP(3),
    "kasubagId" TEXT,

    CONSTRAINT "pengajuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "pengajuanId" TEXT,
    "userId" TEXT,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nip_key" ON "users"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "kendaraan_platNomor_key" ON "kendaraan"("platNomor");

-- CreateIndex
CREATE UNIQUE INDEX "pengajuan_nomorSurat_key" ON "pengajuan"("nomorSurat");

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_kasubagId_fkey" FOREIGN KEY ("kasubagId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_kendaraanId_fkey" FOREIGN KEY ("kendaraanId") REFERENCES "kendaraan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_pengajuanId_fkey" FOREIGN KEY ("pengajuanId") REFERENCES "pengajuan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
