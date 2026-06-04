import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");

  const role = (session.user as any).role;
  const userRestaurantId = (session.user as any).restaurantId;

  // Only allow access to own restaurant (or master)
  const effectiveRestaurantId = role === "MASTER_SUPER" ? restaurantId : userRestaurantId;

  if (!effectiveRestaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  const customers = await prisma.customer.findMany({
    where: { restaurantId: effectiveRestaurantId },
    orderBy: { visitCount: "desc" },
  });

  return NextResponse.json(customers);
}
