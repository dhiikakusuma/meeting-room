import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BookingDetail } from "@/components/booking-detail";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export default async function AtasanBookingDetailPage({ params }: Ctx) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      ruangan: { select: { lantai: true } },
      auditLogs: { orderBy: { timestamp: "desc" } },
    },
  });
  if (!booking) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/atasan/booking"
        className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali
      </Link>
      <BookingDetail booking={booking} role="atasan" />
    </div>
  );
}
