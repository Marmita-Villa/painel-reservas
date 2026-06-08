import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const restaurantId = (session.user as any).restaurantId as string | undefined;

  // Only allow access to own restaurant (or master)
  const role = (session.user as any).role;
  if (role !== "MASTER_SUPER" && restaurantId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(restaurant);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const restaurantId = (session.user as any).restaurantId as string | undefined;
  const role = (session.user as any).role;

  if (role !== "MASTER_SUPER" && restaurantId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, phone, email, address, primaryColor, logoUrl } = body;

  const updated = await prisma.restaurant.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: String(name) }),
      ...(phone !== undefined && { phone: String(phone) }),
      ...(email !== undefined && { email: String(email) }),
      ...(address !== undefined && { address: String(address) }),
      ...(primaryColor !== undefined && { primaryColor: String(primaryColor) }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl === "" ? null : String(logoUrl) }),
    },
  });

  return NextResponse.json(updated);
}
