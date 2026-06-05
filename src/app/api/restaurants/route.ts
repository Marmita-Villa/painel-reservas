import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/restaurants — MASTER_SUPER only
export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "MASTER_SUPER") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const restaurants = await prisma.restaurant.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      email: true,
      address: true,
      isActive: true,
      plan: true,
      planExpiresAt: true,
      reservationsThisMonth: true,
      lastReservationCountReset: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { users: true } },
    },
  });

  return NextResponse.json(restaurants);
}

// POST /api/restaurants — MASTER_SUPER only
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "MASTER_SUPER") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, slug, phone, email, address, adminName, adminEmail, adminPassword } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e slug são obrigatórios" }, { status: 400 });
    }

    const existing = await prisma.restaurant.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug já em uso" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.create({
      data: { name, slug, phone, email, address },
    });

    if (adminName && adminEmail && adminPassword) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashed,
          role: "ADMIN",
          restaurantId: restaurant.id,
        },
      });
    }

    return NextResponse.json(restaurant, { status: 201 });
  } catch (error) {
    console.error("POST /api/restaurants error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
