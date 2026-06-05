import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_SCHEDULES = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isActive: i > 0, // Mon-Sat active, Sunday off
  openTime: "12:00",
  closeTime: "23:00",
  slotInterval: 30,
}));

function ownershipCheck(session: any, id: string) {
  const role = (session.user as any).role;
  const restaurantId = (session.user as any).restaurantId as string | undefined;
  if (role === "MASTER_SUPER") return true;
  return restaurantId === id;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ownershipCheck(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find first active room for this restaurant
  const room = await prisma.room.findFirst({
    where: { restaurantId: id, isActive: true },
    include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
  });

  if (!room || room.schedules.length === 0) {
    return NextResponse.json(DEFAULT_SCHEDULES);
  }

  // Map existing schedules, filling gaps with defaults
  const mapped = DEFAULT_SCHEDULES.map((def) => {
    const existing = room.schedules.find((s) => s.dayOfWeek === def.dayOfWeek);
    if (!existing) return def;
    return {
      dayOfWeek: existing.dayOfWeek,
      isActive: existing.isActive,
      openTime: existing.openTime,
      closeTime: existing.closeTime,
      slotInterval: existing.slotInterval,
    };
  });

  return NextResponse.json(mapped);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ownershipCheck(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!Array.isArray(body) || body.length !== 7) {
    return NextResponse.json({ error: "Body must be array of 7 schedule objects" }, { status: 400 });
  }

  // Find or create the main room
  let room = await prisma.room.findFirst({
    where: { restaurantId: id, isActive: true },
  });

  if (!room) {
    room = await prisma.room.create({
      data: {
        restaurantId: id,
        name: "Salão Principal",
        isActive: true,
      },
    });
  }

  // Since there's no @@unique on (roomId, dayOfWeek), use find + update/create manually
  for (const s of body) {
    const existing = await prisma.schedule.findFirst({
      where: { roomId: room.id, dayOfWeek: Number(s.dayOfWeek) },
    });

    if (existing) {
      await prisma.schedule.update({
        where: { id: existing.id },
        data: {
          isActive: Boolean(s.isActive),
          openTime: String(s.openTime),
          closeTime: String(s.closeTime),
          slotInterval: Number(s.slotInterval) || 30,
        },
      });
    } else {
      await prisma.schedule.create({
        data: {
          roomId: room.id,
          dayOfWeek: Number(s.dayOfWeek),
          isActive: Boolean(s.isActive),
          openTime: String(s.openTime),
          closeTime: String(s.closeTime),
          slotInterval: Number(s.slotInterval) || 30,
          maxCapacity: 50,
          isOnline: true,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
