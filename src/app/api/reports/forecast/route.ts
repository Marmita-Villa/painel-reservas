import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// GET /api/reports/forecast?restaurantId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
    }

    const now = new Date();
    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    // Fetch historical reservations from the last 8 weeks
    const historicalReservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        date: { gte: eightWeeksAgo, lte: now },
        status: { in: ["CONFIRMED", "ARRIVED", "SEATED", "COMPLETED"] },
      },
      select: { date: true, partySize: true },
    });

    // Get total table capacity for the restaurant
    const tables = await prisma.table.findMany({
      where: { room: { restaurantId }, isActive: true },
      select: { capacity: true },
    });
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

    // Group by day of week (0-6)
    const byDow: Record<number, { count: number; weeks: Set<string> }> = {};
    for (let i = 0; i < 7; i++) {
      byDow[i] = { count: 0, weeks: new Set() };
    }

    for (const r of historicalReservations) {
      const dow = r.date.getDay();
      byDow[dow].count += 1;
      // Track which week this falls into (week number)
      const weekStart = new Date(r.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      byDow[dow].weeks.add(weekStart.toISOString().split("T")[0]);
    }

    // Calculate average per day of week across weeks seen
    const avgByDow: Record<number, { avg: number; weeksWithData: number }> = {};
    for (let i = 0; i < 7; i++) {
      const weeksWithData = byDow[i].weeks.size;
      avgByDow[i] = {
        avg: weeksWithData > 0 ? byDow[i].count / weeksWithData : 0,
        weeksWithData,
      };
    }

    // Build forecast for next 14 days
    const forecast = [];
    for (let d = 1; d <= 14; d++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(forecastDate.getDate() + d);
      const dow = forecastDate.getDay();

      const { avg, weeksWithData } = avgByDow[dow];
      const predictedCount = Math.round(avg);
      const predictedOccupancy =
        totalCapacity > 0 ? Math.min(100, Math.round((avg / totalCapacity) * 100)) : 0;

      let confidence: "high" | "medium" | "low";
      if (weeksWithData >= 4) confidence = "high";
      else if (weeksWithData >= 2) confidence = "medium";
      else confidence = "low";

      const dateStr = forecastDate.toISOString().split("T")[0];

      forecast.push({
        date: dateStr,
        dayOfWeek: dow,
        dayName: DAY_NAMES[dow],
        predictedCount,
        predictedOccupancy,
        confidence,
        weeksWithData,
      });
    }

    return NextResponse.json({
      forecast,
      totalCapacity,
      hasData: historicalReservations.length > 0,
    });
  } catch (err) {
    console.error("GET /api/reports/forecast error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
