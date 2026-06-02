import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatName } from "@/lib/utils";

// São Paulo is UTC-3
const TZ_OFFSET = -3;

function toSaoPauloDate(dateStr: string, time = "00:00"): Date {
  // Build ISO string treating input as São Paulo time → converts to UTC
  return new Date(`${dateStr}T${time}:00${TZ_OFFSET < 0 ? "-" : "+"}${String(Math.abs(TZ_OFFSET)).padStart(2,"0")}:00`);
}

// GET /api/reservations?date=2026-06-05&restaurantId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date         = searchParams.get("date");
    const restaurantId = searchParams.get("restaurantId");
    const status       = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (restaurantId) where.restaurantId = restaurantId;
    if (status)       where.status       = status;

    if (date) {
      // Start of day and end of day in São Paulo time
      const start = toSaoPauloDate(date, "00:00");
      const end   = toSaoPauloDate(date, "23:59");
      where.date = { gte: start, lte: end };
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: { customer: true, table: true },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("GET /api/reservations error:", error);
    return NextResponse.json({ error: "Erro ao buscar reservas" }, { status: 500 });
  }
}

// POST /api/reservations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, name, phone, date, time, partySize, notes, occasion, origin = "WIDGET" } = body;

    // Upsert customer by phone
    let customer = await prisma.customer.findFirst({ where: { restaurantId, phone } });

    const formattedName = formatName(name);

    if (!customer) {
      customer = await prisma.customer.create({
        data: { restaurantId, name: formattedName, phone },
      });
    } else {
      // Update name formatting if needed
      await prisma.customer.update({
        where: { id: customer.id },
        data: { name: formattedName },
      });
    }

    // Build datetime in São Paulo timezone → store as UTC
    const reservationDate = toSaoPauloDate(date, time);

    const reservation = await prisma.reservation.create({
      data: {
        restaurantId,
        customerId: customer.id,
        date: reservationDate,
        partySize: Number(partySize),
        notes: notes || null,
        occasion: occasion || null,
        origin,
        status: "CONFIRMED",
      },
      include: { customer: true },
    });

    await prisma.customer.update({
      where: { id: customer.id },
      data: { visitCount: { increment: 1 } },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("POST /api/reservations error:", error);
    return NextResponse.json({ error: "Erro ao criar reserva" }, { status: 500 });
  }
}
