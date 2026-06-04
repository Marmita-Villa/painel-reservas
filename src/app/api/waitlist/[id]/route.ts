import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWaitlistReady } from "@/lib/notifications";

// PATCH /api/waitlist/[id]  { status: "CALLED" | "SEATED" | "CANCELLED" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ["WAITING", "CALLED", "SEATED", "CANCELLED", "NO_SHOW"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const data: Record<string, unknown> = { status };
    if (status === "CALLED")  data.calledAt  = new Date();
    if (status === "SEATED")  data.seatedAt  = new Date();

    const entry = await prisma.waitlistEntry.update({
      where: { id },
      data,
      include: { restaurant: true },
    });

    // Send WhatsApp when status changes to CALLED
    if (status === "CALLED" && entry.phone) {
      try {
        await sendWaitlistReady({
          phone: entry.phone,
          customerName: entry.name,
          restaurantName: entry.restaurant.name,
          restaurantId: entry.restaurantId,
          waitlistEntryId: entry.id,
        });
      } catch (notifErr) {
        console.error("Waitlist notification error:", notifErr);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PATCH /api/waitlist/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar entrada" }, { status: 500 });
  }
}
