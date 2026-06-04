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

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      reservations: {
        orderBy: { date: "desc" },
        include: { table: true },
      },
      notificationLogs: {
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(customer);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { allergies, preferences, favoriteTable, internalNotes, isBlacklisted, blacklistReason, tags } = body;

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(allergies !== undefined && { allergies }),
      ...(preferences !== undefined && { preferences }),
      ...(favoriteTable !== undefined && { favoriteTable }),
      ...(internalNotes !== undefined && { internalNotes }),
      ...(isBlacklisted !== undefined && { isBlacklisted }),
      ...(blacklistReason !== undefined && { blacklistReason }),
      ...(tags !== undefined && { tags }),
    },
  });

  return NextResponse.json(updated);
}
