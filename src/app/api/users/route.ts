import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/users
export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const restaurantId = (session?.user as any)?.restaurantId;

  if (!role || role === "GERENTE" || role === "USUARIO") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const where =
    role === "MASTER_SUPER"
      ? {}
      : { restaurantId: restaurantId ?? "__none__" };

  const users = await prisma.user.findMany({
    where,
    include: { restaurant: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const safeUsers = users.map(({ password: _pw, ...u }) => u);

  return NextResponse.json(safeUsers);
}

// POST /api/users
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const sessionRestaurantId = (session?.user as any)?.restaurantId;

  if (!role || role === "GERENTE" || role === "USUARIO") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role: newRole, restaurantId: bodyRestaurantId } = body;

    if (!name || !email || !password || !newRole) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    // ADMIN cannot create MASTER_SUPER
    if (role === "ADMIN" && newRole === "MASTER_SUPER") {
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
    }

    const targetRestaurantId =
      role === "MASTER_SUPER" ? bodyRestaurantId : sessionRestaurantId;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: newRole,
        restaurantId: targetRestaurantId,
      },
    });

    const { password: _pw, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
