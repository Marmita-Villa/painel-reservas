import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/restaurants/[id]/plan — MASTER_SUPER only
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== "MASTER_SUPER") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { plan } = body;

    if (!["FREE", "PRO", "PREMIUM"].includes(plan)) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { plan },
    });

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("PUT /api/restaurants/[id]/plan error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
