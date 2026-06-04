import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/tables/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { posX, posY, name, capacity, isActive, shape } = body;

    const data: Record<string, unknown> = {};
    if (posX !== undefined) data.posX = Number(posX);
    if (posY !== undefined) data.posY = Number(posY);
    if (name !== undefined) data.name = name;
    if (capacity !== undefined) data.capacity = Number(capacity);
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (shape !== undefined) data.shape = shape;

    const table = await prisma.table.update({ where: { id }, data });
    return NextResponse.json(table);
  } catch (err) {
    console.error("PUT /api/tables/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tables/[id] — soft delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.table.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tables/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
