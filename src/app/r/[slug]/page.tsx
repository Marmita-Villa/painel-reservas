import WidgetClient from "./WidgetClient";

// Mock restaurant data — later fetched from DB by slug
const mockRestaurant = {
  slug: "ristorante-roma",
  name: "Ristorante Roma",
  description: "Culinária italiana autêntica no coração de São Paulo",
  address: "Rua Augusta, 1200 — Consolação, São Paulo",
  coverUrl: null,
  logoUrl: null,
  primaryColor: "#6c63ff",
  phone: "(11) 99999-9999",
  availableSlots: [
    { date: "2026-06-02", times: ["12:00", "12:30", "13:00", "19:00", "19:30", "20:00", "20:30", "21:00"] },
    { date: "2026-06-03", times: ["12:00", "12:30", "13:00", "13:30", "19:00", "19:30", "20:00", "21:00"] },
    { date: "2026-06-04", times: ["12:00", "13:00", "19:30", "20:00", "20:30"] },
    { date: "2026-06-05", times: ["12:00", "12:30", "13:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"] },
    { date: "2026-06-06", times: ["12:00", "13:00", "19:00", "20:00", "21:00"] },
    { date: "2026-06-07", times: ["12:00", "12:30", "13:00", "13:30", "19:00", "19:30", "20:00", "20:30"] },
  ],
};

export default function WidgetPage({ params }: { params: { slug: string } }) {
  return <WidgetClient restaurant={mockRestaurant} />;
}
