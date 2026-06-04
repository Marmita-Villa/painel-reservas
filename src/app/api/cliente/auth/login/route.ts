import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signCustomerToken, cookieOptions } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, slug } = await req.json();

    if (!email || !password || !slug) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    const account = await prisma.customerAccount.findFirst({
      where: {
        email,
        customer: { restaurantId: restaurant.id },
      },
      include: { customer: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, account.password);
    if (!valid) {
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
    }

    const token = signCustomerToken({
      customerId: account.customerId,
      customerAccountId: account.id,
      restaurantSlug: slug,
      name: account.customer.name,
      email: account.email,
    });

    const cookieStore = await cookies();
    cookieStore.set("customer-session", token, cookieOptions);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
