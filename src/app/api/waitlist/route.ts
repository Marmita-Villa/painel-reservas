import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/waitlist?restaurantId=xxx
export async function GET(req: NextRequest) {
  try {
    const restaurantId = new URL(req.url).searchParams.get("restaurantId");

    const entries = await prisma.waitlistEntry.findMany({
      where: {
        restaurantId: restaurantId || undefined,
        status: { in: ["WAITING", "CALLED"] },
      },
      include: { customer: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/waitlist error:", error);
    return NextResponse.json({ error: "Erro ao buscar fila" }, { status: 500 });
  }
}

// POST /api/waitlist
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, name, phone, partySize, notes } = body;

    const entry = await prisma.waitlistEntry.create({
      data: {
        restaurantId,
        name,
        phone,
        partySize: Number(partySize),
        notes: notes || null,
        status: "WAITING",
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/waitlist error:", error);
    return NextResponse.json({ error: "Erro ao entrar na fila" }, { status: 500 });
  }
}
