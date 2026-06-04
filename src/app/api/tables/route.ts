import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/tables?restaurantId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
    }

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const tables = await prisma.table.findMany({
      where: { room: { restaurantId }, isActive: true },
      include: {
        room: { select: { id: true, name: true } },
        reservations: {
          where: {
            date: { gte: now, lte: twoHoursFromNow },
            status: { in: ["CONFIRMED", "ARRIVED", "SEATED"] },
          },
          include: { customer: { select: { name: true, phone: true } } },
          orderBy: { date: "asc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    const result = tables.map((t) => {
      const activeRes = t.reservations[0] ?? null;
      let currentStatus: "FREE" | "RESERVED" | "OCCUPIED" | "BLOCKED" = "FREE";

      if (!t.isActive) {
        currentStatus = "BLOCKED";
      } else if (activeRes) {
        if (activeRes.status === "ARRIVED" || activeRes.status === "SEATED") {
          currentStatus = "OCCUPIED";
        } else {
          currentStatus = "RESERVED";
        }
      }

      return {
        id: t.id,
        roomId: t.roomId,
        roomName: t.room.name,
        name: t.name,
        capacity: t.capacity,
        minCapacity: t.minCapacity,
        posX: t.posX,
        posY: t.posY,
        shape: t.shape,
        isActive: t.isActive,
        currentStatus,
        currentReservation: activeRes
          ? {
              id: activeRes.id,
              date: activeRes.date,
              partySize: activeRes.partySize,
              status: activeRes.status,
              customerName: activeRes.customer?.name ?? null,
              customerPhone: activeRes.customer?.phone ?? null,
            }
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/tables error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tables
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roomId, name, capacity, shape, posX, posY } = body;

    if (!roomId || !name || !capacity) {
      return NextResponse.json({ error: "roomId, name, capacity required" }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        roomId,
        name,
        capacity: Number(capacity),
        shape: shape ?? "rectangle",
        posX: posX ?? 50,
        posY: posY ?? 50,
        isActive: true,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    console.error("POST /api/tables error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
