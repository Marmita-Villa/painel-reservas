import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WidgetClient from "./WidgetClient";

function generateSlots(restaurant: {
  rooms: Array<{ schedules: Array<{ dayOfWeek: number; openTime: string; closeTime: string; slotInterval: number; isOnline: boolean }> }>;
  settings: { maxAdvanceDays: number } | null;
}) {
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
          if (!times.includes(t)) times.push(t);
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

  const availableSlots = generateSlots(restaurant);

  const widgetRestaurant = {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    description: restaurant.settings ? "" : "Faça sua reserva online",
    address: restaurant.address ?? "",
    coverUrl: null,
    logoUrl: restaurant.logoUrl ?? null,
    primaryColor: "#6c63ff",
    phone: restaurant.phone ?? "",
    availableSlots,
  };

  return <WidgetClient restaurant={widgetRestaurant} />;
}
