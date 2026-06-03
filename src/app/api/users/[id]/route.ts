import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/users/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const sessionRestaurantId = (session?.user as any)?.restaurantId;

  if (!role || role === "GERENTE" || role === "USUARIO") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { role: newRole, isActive } = body;

    // ADMIN cannot assign MASTER_SUPER
    if (role === "ADMIN" && newRole === "MASTER_SUPER") {
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // ADMIN can only update users of their restaurant
    if (role === "ADMIN" && target.restaurantId !== sessionRestaurantId) {
      return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (newRole !== undefined) data.role = newRole;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.user.update({ where: { id }, data });
    const { password: _pw, ...safeUser } = updated;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("PUT /api/users/:id error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/users/:id — deactivates the user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const sessionRestaurantId = (session?.user as any)?.restaurantId;

  if (!role || role === "GERENTE" || role === "USUARIO") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (role === "ADMIN" && target.restaurantId !== sessionRestaurantId) {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
