import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const restaurantId = (session.user as any).restaurantId as string | undefined;
  if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 3) return NextResponse.json({ reservations: [], customers: [] });

  const [reservations, customers] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        restaurantId,
        customer: { name: { contains: q, mode: "insensitive" } },
      },
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.customer.findMany({
      where: {
        restaurantId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    reservations: reservations.map((r) => ({
      id: r.id,
      customerName: r.customer?.name ?? "—",
      date: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      }).format(r.date),
      status: r.status,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone ?? "—",
    })),
  });
}
