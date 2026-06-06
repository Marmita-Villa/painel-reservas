import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/menu/[categoryId]/items
export async function POST(req: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { categoryId } = await params;
  const body = await req.json();
  const { name, description, price, imageUrl, tags } = body;

  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const count = await prisma.menuItem.count({ where: { categoryId } });

  const item = await prisma.menuItem.create({
    data: {
      categoryId,
      name,
      description: description || null,
      price: price ? Number(price) : null,
      imageUrl: imageUrl || null,
      tags: tags ?? [],
      position: count,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
