import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { BookingDetail } from "@/components/booking-detail";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export default async function PemohonBookingDetailPage({ params }: Ctx) {
  const me = (await getSessionUser())!;
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      ruangan: { select: { lantai: true } },
      auditLogs: { orderBy: { timestamp: "desc" } },
    },
  });
  if (!booking || booking.pemohonId !== me.id) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/pemohon"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali
      </Link>
      <BookingDetail booking={booking} role="pemohon" />
    </div>
  );
}
