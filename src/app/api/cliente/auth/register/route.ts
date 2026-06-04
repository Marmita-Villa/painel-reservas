import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signCustomerToken, cookieOptions } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, password, birthday, slug } = await req.json();

    if (!name || !phone || !email || !password || !slug) {
      return NextResponse.json({ error: "Todos os campos obrigatórios devem ser preenchidos" }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    // Check existing account with this email in this restaurant
    const existingAccount = await prisma.customerAccount.findFirst({
      where: {
        email,
        customer: { restaurantId: restaurant.id },
      },
    });

    if (existingAccount) {
      return NextResponse.json({ error: "Já existe uma conta com este email" }, { status: 409 });
    }

    // Find or create customer by phone
    let customer = await prisma.customer.findUnique({
      where: { restaurantId_phone: { restaurantId: restaurant.id, phone } },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          restaurantId: restaurant.id,
          name,
          phone,
          email,
          birthday: birthday ? new Date(birthday) : undefined,
        },
      });
    } else {
      // Update name/email if customer already exists
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name, email, birthday: birthday ? new Date(birthday) : undefined },
      });
    }

    const hashed = await bcrypt.hash(password, 12);

    const account = await prisma.customerAccount.create({
      data: {
        email,
        password: hashed,
        customerId: customer.id,
      },
    });

    const token = signCustomerToken({
      customerId: customer.id,
      customerAccountId: account.id,
      restaurantSlug: slug,
      name: customer.name,
      email: account.email,
    });

    const cookieStore = await cookies();
    cookieStore.set("customer-session", token, cookieOptions);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
