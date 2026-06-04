import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TZ_OFFSET = -3;

function toSaoPauloDate(dateStr: string, time = "00:00"): Date {
  return new Date(`${dateStr}T${time}:00${TZ_OFFSET < 0 ? "-" : "+"}${String(Math.abs(TZ_OFFSET)).padStart(2, "0")}:00`);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function csvEscape(value: string | null | undefined): string {
  const str = value ?? "";
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (restaurantId) where.restaurantId = restaurantId;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: toSaoPauloDate(dateFrom, "00:00") } : {}),
      ...(dateTo ? { lte: toSaoPauloDate(dateTo, "23:59") } : {}),
    };
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: { customer: true, table: true },
    orderBy: { date: "asc" },
  });

  const headers = ["Data/Hora", "Cliente", "Telefone", "Pessoas", "Mesa", "Status", "Origem", "Ocasião", "Observações"];
  const rows = reservations.map(r => [
    formatDateTime(r.date),
    r.customer?.name ?? "",
    r.customer?.phone ?? "",
    String(r.partySize),
    r.table?.name ?? "",
    r.status,
    r.origin,
    r.occasion ?? "",
    r.notes ?? "",
  ].map(csvEscape).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const today = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservas-${today}.csv"`,
    },
  });
}
