import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = getCustomerSession(cookieStore.get("customer-session")?.value);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { name: true, phone: true, email: true, birthday: true, allergies: true, preferences: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const session = getCustomerSession(cookieStore.get("customer-session")?.value);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, birthday, allergies, preferences, currentPassword, newPassword } = body;

  // Password change
  if (currentPassword && newPassword) {
    const account = await prisma.customerAccount.findUnique({
      where: { id: session.customerAccountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, account.password);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.customerAccount.update({
      where: { id: session.customerAccountId },
      data: { password: hashed },
    });

    return NextResponse.json({ ok: true });
  }

  // Profile update
  await prisma.customer.update({
    where: { id: session.customerId },
    data: {
      name: name ?? undefined,
      phone: phone ?? undefined,
      birthday: birthday ? new Date(birthday) : undefined,
      allergies: allergies ?? undefined,
      preferences: preferences ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
