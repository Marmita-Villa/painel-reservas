import WidgetClient from "./WidgetClient";

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID ?? "cmpwr87ok0000y0vm4bw1s7l6";

function generateSlots() {
  const slots = [];
  const times = ["12:00", "12:30", "13:00", "19:00", "19:30", "20:00", "20:30", "21:00"];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    slots.push({ date: dateStr, times });
  }
  return slots;
}

const restaurant = {
  id: RESTAURANT_ID,
  slug: "ristorante-roma",
  name: "Ristorante Roma",
  description: "Culinária italiana autêntica no coração de São Paulo",
  address: "Rua Augusta, 1200 — Consolação, São Paulo",
  coverUrl: null,
  logoUrl: null,
  primaryColor: "#6c63ff",
  phone: "(11) 99999-9999",
  availableSlots: generateSlots(),
};

export default function WidgetPage() {
  return <WidgetClient restaurant={restaurant} />;
}
