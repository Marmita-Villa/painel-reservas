import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/reservations/:id  — update status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, tableId } = body;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(tableId && { tableId }),
      },
      include: { customer: true, table: true },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("PATCH /api/reservations/:id error:", error);
    return NextResponse.json({ error: "Erro ao atualizar reserva" }, { status: 500 });
  }
}

// DELETE /api/reservations/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.reservation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/reservations/:id error:", error);
    return NextResponse.json({ error: "Erro ao deletar reserva" }, { status: 500 });
  }
}
