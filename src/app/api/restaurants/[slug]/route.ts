import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/restaurants/:slug — public endpoint for widget
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        settings: true,
        rooms: {
          where: { isActive: true },
          include: {
            schedules: { where: { isActive: true } },
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("GET /api/restaurants/:slug error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
