import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/menu/items/[itemId]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { itemId } = await params;
  const body = await req.json();
  const { name, description, price, imageUrl, tags, isActive, position } = body;

  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: price === null ? null : Number(price) }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(tags !== undefined && { tags }),
      ...(isActive !== undefined && { isActive }),
      ...(position !== undefined && { position }),
    },
  });

  return NextResponse.json(item);
}

// DELETE /api/menu/items/[itemId]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { itemId } = await params;
  await prisma.menuItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
