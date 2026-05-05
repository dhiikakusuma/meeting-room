-- AlterTable
ALTER TABLE "pengajuan" ADD COLUMN     "catatanVerifikator" TEXT,
ADD COLUMN     "statusVerifikasi" TEXT NOT NULL DEFAULT 'menunggu_verifikasi',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
