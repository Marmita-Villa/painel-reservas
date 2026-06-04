import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getPeriodDates(period: string) {
  const now = new Date();
  let days = 30;
  if (period === "7d") days = 7;
  if (period === "3m") days = 90;

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(-1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  prevStart.setHours(0, 0, 0, 0);

  return { start, end, prevStart, prevEnd };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const restaurantId = (session.user as any).restaurantId as string | undefined;
  if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

  const period = req.nextUrl.searchParams.get("period") ?? "30d";
  const { start, end, prevStart, prevEnd } = getPeriodDates(period);

  const [current, previous] = await Promise.all([
    prisma.reservation.findMany({
      where: { restaurantId, date: { gte: start, lte: end } },
      include: { customer: { select: { name: true, phone: true } } },
    }),
    prisma.reservation.findMany({
      where: { restaurantId, date: { gte: prevStart, lte: prevEnd } },
      select: { status: true, partySize: true },
    }),
  ]);

  const total = current.length;
  const totalPrev = previous.length;
  const guests = current.reduce((s, r) => s + r.partySize, 0);
  const guestsPrev = previous.reduce((s, r) => s + r.partySize, 0);
  const cancelled = current.filter((r) => r.status === "CANCELLED").length;
  const cancelledPrev = previous.filter((r) => r.status === "CANCELLED").length;
  const noShows = current.filter((r) => r.status === "NO_SHOW").length;
  const noShowsPrev = previous.filter((r) => r.status === "NO_SHOW").length;

  function pctChange(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? "+100%" : "0%";
    const d = ((curr - prev) / prev) * 100;
    return `${d >= 0 ? "+" : ""}${d.toFixed(0)}%`;
  }

  const cancelRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0.0";
  const noShowRate = total > 0 ? ((noShows / total) * 100).toFixed(1) : "0.0";
  const cancelRatePrev = totalPrev > 0 ? (cancelledPrev / totalPrev) * 100 : 0;
  const cancelRateCurr = total > 0 ? (cancelled / total) * 100 : 0;
  const noShowRatePrev = totalPrev > 0 ? (noShowsPrev / totalPrev) * 100 : 0;
  const noShowRateCurr = total > 0 ? (noShows / total) * 100 : 0;

  const kpis = [
    { label: "Total de Reservas", value: String(total), change: pctChange(total, totalPrev), positive: total >= totalPrev },
    { label: "Clientes Atendidos", value: String(guests), change: pctChange(guests, guestsPrev), positive: guests >= guestsPrev },
    { label: "Taxa de Cancelamento", value: `${cancelRate}%`, change: pctChange(cancelRateCurr, cancelRatePrev), positive: cancelRateCurr <= cancelRatePrev },
    { label: "Taxa de No-Show", value: `${noShowRate}%`, change: pctChange(noShowRateCurr, noShowRatePrev), positive: noShowRateCurr <= noShowRatePrev },
  ];

  const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const dayCounts: number[] = Array(7).fill(0);
  for (const r of current) dayCounts[new Date(r.date).getDay()]++;
  const maxDay = Math.max(...dayCounts, 1);
  const byDay = DAY_NAMES.map((day, i) => ({
    day, count: dayCounts[i],
    pct: Math.round((dayCounts[i] / maxDay) * 100),
    busiest: dayCounts[i] === maxDay && dayCounts[i] > 0,
  })).sort((a, b) => b.count - a.count);

  const originCounts: Record<string, number> = {};
  for (const r of current) originCounts[r.origin] = (originCounts[r.origin] ?? 0) + 1;
  const byOrigin = Object.entries(originCounts).sort((a, b) => b[1] - a[1]).map(([origin, count]) => ({
    name: ({ WIDGET: "Widget (Site)", INTERNAL: "Interno", GOOGLE: "Google", WHATSAPP: "WhatsApp", INSTAGRAM: "Instagram", PHONE: "Telefone" } as Record<string,string>)[origin] ?? origin,
    count,
    pct: total > 0 ? Math.round((count / total) * 100) : 0,
    color: ({ WIDGET: "var(--primary)", INTERNAL: "var(--info)", GOOGLE: "#ea4335", WHATSAPP: "#25d366", INSTAGRAM: "#e1306c", PHONE: "var(--warning)" } as Record<string,string>)[origin] ?? "var(--foreground-dim)",
  }));

  const hourCounts: Record<number, number> = {};
  for (const r of current) { const h = new Date(r.date).getHours(); hourCounts[h] = (hourCounts[h] ?? 0) + 1; }
  const maxHour = Math.max(...Object.values(hourCounts), 1);
  const byHour = Object.entries(hourCounts).sort((a, b) => Number(a[0]) - Number(b[0])).map(([h, count]) => ({
    hour: `${h}h`, count, pct: Math.round((count / maxHour) * 100),
  }));

  const recentNoShows = current
    .filter((r) => r.status === "NO_SHOW")
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      customerName: r.customer?.name ?? "Cliente não identificado",
      phone: r.customer?.phone ?? "—",
      date: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(r.date),
    }));

  return NextResponse.json({ kpis, byDay, byOrigin, byHour, recentNoShows });
}
