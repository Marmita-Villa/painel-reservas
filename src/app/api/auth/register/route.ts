import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/auth/register — create first admin user
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, secret } = await req.json();

    // Protect with a secret so only you can create users
    if (secret !== process.env.REGISTER_SECRET) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        restaurantId: process.env.NEXT_PUBLIC_RESTAURANT_ID,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
