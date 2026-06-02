import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reservations?date=2026-06-05&restaurantId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const restaurantId = searchParams.get("restaurantId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (restaurantId) where.restaurantId = restaurantId;
    if (status) where.status = status;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        customer: true,
        table: true,
      },
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
    const {
      restaurantId,
      name,
      phone,
      date,
      time,
      partySize,
      notes,
      occasion,
      origin = "WIDGET",
    } = body;

    // Upsert customer by phone
    let customer = await prisma.customer.findFirst({
      where: { restaurantId, phone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          restaurantId,
          name,
          phone,
        },
      });
    }

    // Build datetime from date + time
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const reservationDate = new Date(year, month - 1, day, hours, minutes);

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
      include: {
        customer: true,
      },
    });

    // Update visit count
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
