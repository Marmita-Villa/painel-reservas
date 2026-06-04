import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const session = getCustomerSession(cookieStore.get("customer-session")?.value);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "active";
  const now = new Date();

  let reservations;

  if (type === "history") {
    reservations = await prisma.reservation.findMany({
      where: {
        customerId: session.customerId,
        OR: [
          { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
          { status: { in: ["CONFIRMED", "PENDING", "ARRIVED", "SEATED"] }, date: { lt: now } },
        ],
      },
      include: { table: true, restaurant: { select: { name: true } } },
      orderBy: { date: "desc" },
    });
  } else {
    // active
    reservations = await prisma.reservation.findMany({
      where: {
        customerId: session.customerId,
        status: { in: ["CONFIRMED", "PENDING", "ARRIVED", "SEATED"] },
        date: { gte: now },
      },
      include: { table: true, restaurant: { select: { name: true } } },
      orderBy: { date: "asc" },
    });
  }

  return NextResponse.json({ reservations });
}
