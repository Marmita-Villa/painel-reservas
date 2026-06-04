import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reservations/calendar?restaurantId=xxx&year=2026&month=6
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 1);

    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId: restaurantId || undefined,
        date: { gte: start, lt: end },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { date: true },
    });

    const counts: Record<string, number> = {};
    for (const r of reservations) {
      // Convert to SP local date string
      const local = new Date(r.date.getTime() - 3 * 60 * 60 * 1000); // UTC-3
      const key = local.toISOString().split("T")[0];
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return NextResponse.json(counts);
  } catch (error) {
    console.error("GET /api/reservations/calendar error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
