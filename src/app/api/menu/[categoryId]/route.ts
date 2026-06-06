import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/menu/[categoryId]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { categoryId } = await params;
  const body = await req.json();
  const { name, description, isActive, position } = body;

  const category = await prisma.menuCategory.update({
    where: { id: categoryId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(position !== undefined && { position }),
    },
    include: { items: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json(category);
}

// DELETE /api/menu/[categoryId]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { categoryId } = await params;
  await prisma.menuCategory.delete({ where: { id: categoryId } });
  return NextResponse.json({ ok: true });
}
