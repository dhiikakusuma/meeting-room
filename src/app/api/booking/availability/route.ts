import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES } from "@/lib/booking-rules";
import { parseDateInput } from "@/lib/datetime";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ruanganId = url.searchParams.get("ruanganId");
  const tanggal = url.searchParams.get("tanggal"); // YYYY-MM-DD
  if (!ruanganId || !tanggal) {
    return NextResponse.json({ error: "ruanganId & tanggal wajib" }, { status: 400 });
  }
  const start = parseDateInput(tanggal);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      ruanganId,
      tanggal: { gte: start, lt: end },
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: {
      id: true,
      pemohonNama: true,
      bidangNama: true,
      jamMulai: true,
      jamSelesai: true,
      status: true,
      agenda: true,
    },
    orderBy: { jamMulai: "asc" },
  });

  return NextResponse.json({ bookings });
}
