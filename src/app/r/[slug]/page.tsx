import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WidgetClient from "./WidgetClient";

function generateSlots(
  restaurant: {
    rooms: Array<{ schedules: Array<{ dayOfWeek: number; openTime: string; closeTime: string; slotInterval: number; isOnline: boolean; maxCapacity: number }> }>;
    settings: { maxAdvanceDays: number } | null;
  },
  reservationCounts: Map<string, number> // "dateStr|HH:MM" → count
) {
  const maxDays = restaurant.settings?.maxAdvanceDays ?? 30;
  const slots: { date: string; times: string[] }[] = [];

  for (let i = 0; i < maxDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const dateStr = d.toISOString().split("T")[0];

    const times: string[] = [];

    for (const room of restaurant.rooms) {
      for (const schedule of room.schedules) {
        if (!schedule.isOnline) continue;
        if (schedule.dayOfWeek !== dow) continue;

        const [oh, om] = schedule.openTime.split(":").map(Number);
        const [ch, cm] = schedule.closeTime.split(":").map(Number);
        let cur = oh * 60 + om;
        const end = ch * 60 + cm;

        while (cur < end) {
          const hh = String(Math.floor(cur / 60)).padStart(2, "0");
          const mm = String(cur % 60).padStart(2, "0");
          const t = `${hh}:${mm}`;
          // Skip if slot is full (maxCapacity > 0 and reservations >= maxCapacity)
          const key = `${dateStr}|${t}`;
          const count = reservationCounts.get(key) ?? 0;
          const cap = schedule.maxCapacity;
          const isFull = cap > 0 && count >= cap;
          if (!times.includes(t) && !isFull) times.push(t);
          cur += schedule.slotInterval;
        }
      }
    }

    times.sort();
    if (times.length > 0) slots.push({ date: dateStr, times });
  }

  // Fallback to static slots if no schedules configured
  if (slots.length === 0) {
    const staticTimes = ["12:00", "12:30", "13:00", "19:00", "19:30", "20:00", "20:30", "21:00"];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      slots.push({ date: d.toISOString().split("T")[0], times: staticTimes });
    }
  }

  return slots;
}

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      settings: true,
      rooms: {
        where: { isActive: true },
        include: {
          schedules: { where: { isActive: true } },
        },
      },
    },
  });

  if (!restaurant) notFound();

  // Count existing confirmed reservations per slot for the next 30 days
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + (restaurant.settings?.maxAdvanceDays ?? 30));

  const existingReservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      date: { gte: now, lte: future },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { date: true },
  });

  // Build map: "dateStr|HH:MM" → count
  const reservationCounts = new Map<string, number>();
  for (const r of existingReservations) {
    const d = new Date(r.date);
    const dateStr = d.toISOString().split("T")[0];
    const hh = String(d.getUTCHours() - (-3)).padStart(2, "0"); // SP UTC-3 approx
    const mm = String(d.getMinutes()).padStart(2, "0");
    const key = `${dateStr}|${hh}:${mm}`;
    reservationCounts.set(key, (reservationCounts.get(key) ?? 0) + 1);
  }

  const availableSlots = generateSlots(restaurant, reservationCounts);

  const widgetRestaurant = {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    description: "Faça sua reserva online em poucos segundos.",
    address: restaurant.address ?? "",
    coverUrl: null,
    logoUrl: restaurant.logoUrl ?? null,
    primaryColor: "#6c63ff",
    phone: restaurant.phone ?? "",
    email: restaurant.email ?? "",
    totalSlots: availableSlots.reduce((acc, s) => acc + s.times.length, 0),
    availableSlots,
  };

  return <WidgetClient restaurant={widgetRestaurant} />;
}
