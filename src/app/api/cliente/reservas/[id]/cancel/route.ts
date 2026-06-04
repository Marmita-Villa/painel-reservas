import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const session = getCustomerSession(cookieStore.get("customer-session")?.value);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({ where: { id } });

  if (!reservation || reservation.customerId !== session.customerId) {
    return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
  }

  if (!["CONFIRMED", "PENDING"].includes(reservation.status)) {
    return NextResponse.json({ error: "Esta reserva não pode ser cancelada" }, { status: 400 });
  }

  if (new Date(reservation.date) <= new Date()) {
    return NextResponse.json({ error: "Não é possível cancelar reservas passadas" }, { status: 400 });
  }

  await prisma.reservation.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
