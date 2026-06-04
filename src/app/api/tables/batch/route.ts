import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/tables/batch
// Body: { tables: [{ id, posX, posY }] }
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tables } = await req.json();
    if (!Array.isArray(tables)) {
      return NextResponse.json({ error: "tables array required" }, { status: 400 });
    }

    await prisma.$transaction(
      tables.map(({ id, posX, posY }: { id: string; posX: number; posY: number }) =>
        prisma.table.update({
          where: { id },
          data: { posX: Number(posX), posY: Number(posY) },
        })
      )
    );

    return NextResponse.json({ success: true, updated: tables.length });
  } catch (err) {
    console.error("PUT /api/tables/batch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
