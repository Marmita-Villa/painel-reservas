import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/menu?restaurantId=xxx — public or authenticated
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");
  const slug = searchParams.get("slug");

  const where: any = { isActive: true };

  if (restaurantId) {
    where.restaurantId = restaurantId;
  } else if (slug) {
    const restaurant = await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } });
    if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    where.restaurantId = restaurant.id;
  } else {
    return NextResponse.json({ error: "restaurantId ou slug obrigatório" }, { status: 400 });
  }

  const categories = await prisma.menuCategory.findMany({
    where,
    include: {
      items: {
        where: { isActive: true },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(categories);
}

// POST /api/menu — create category (authenticated)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = session.user as any;
  const restaurantId = user.restaurantId;
  if (!restaurantId) return NextResponse.json({ error: "Sem restaurante" }, { status: 400 });

  const body = await req.json();
  const { name, description } = body;
  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  // Get next position
  const count = await prisma.menuCategory.count({ where: { restaurantId } });

  const category = await prisma.menuCategory.create({
    data: { restaurantId, name, description: description || null, position: count },
    include: { items: true },
  });

  return NextResponse.json(category, { status: 201 });
}
