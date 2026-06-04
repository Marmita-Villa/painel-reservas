import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const TZ = "America/Sao_Paulo";

function todaySaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

function spDate(dateStr: string, time: string) {
  return new Date(`${dateStr}T${time}:00-03:00`);
}

// GET /api/dashboard?restaurantId=xxx (optional for MASTER_SUPER)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    const userRestaurantId = (session?.user as any)?.restaurantId;

    const { searchParams } = new URL(req.url);
    const queryRestaurantId = searchParams.get("restaurantId") || undefined;

    // Determine which restaurant(s) to query
    let restaurantId: string | undefined;
    if (role === "MASTER_SUPER") {
      restaurantId = queryRestaurantId; // undefined = all restaurants
    } else {
      restaurantId = userRestaurantId;
    }

    const todayStr = todaySaoPaulo();
    const start = spDate(todayStr, "00:00");
    const end   = spDate(todayStr, "23:59");

    const whereReservation: Record<string, unknown> = { date: { gte: start, lte: end } };
    const whereWaitlist: Record<string, unknown> = { status: { in: ["WAITING", "CALLED"] } };

    if (restaurantId) {
      whereReservation.restaurantId = restaurantId;
      whereWaitlist.restaurantId = restaurantId;
    }

    const [reservations, waitlist, settings] = await Promise.all([
      prisma.reservation.findMany({
        where: whereReservation,
        include: { customer: true, table: true },
        orderBy: { date: "asc" },
      }),
      prisma.waitlistEntry.findMany({ where: whereWaitlist }),
      restaurantId
        ? prisma.restaurantSettings.findUnique({ where: { restaurantId } })
        : null,
    ]);

    const totalPeople = reservations
      .filter(r => !["CANCELLED", "NO_SHOW"].includes(r.status))
      .reduce((s, r) => s + r.partySize, 0);

    // Birthday guests: customers with reservations today whose birthday month+day matches today
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    const birthdayGuests = reservations
      .filter(r => {
        if (!r.customer?.birthday) return false;
        const bday = new Date(r.customer.birthday);
        return bday.getMonth() === todayMonth && bday.getDate() === todayDay;
      })
      .map(r => ({ id: r.customerId, name: r.customer?.name ?? "" }))
      .filter((g, idx, arr) => arr.findIndex(x => x.id === g.id) === idx); // dedupe

    // Estimated revenue: sum of partySize * averageTicket for active reservations today
    const averageTicket = (settings as any)?.averageTicket ?? 0;
    const estimatedRevenue = averageTicket > 0
      ? reservations
          .filter(r => ["CONFIRMED", "ARRIVED", "SEATED", "COMPLETED"].includes(r.status))
          .reduce((s, r) => s + r.partySize * averageTicket, 0)
      : 0;

    return NextResponse.json({ reservations, waitlist, totalPeople, birthdayGuests, estimatedRevenue });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Erro ao buscar dados do dashboard" }, { status: 500 });
  }
}
