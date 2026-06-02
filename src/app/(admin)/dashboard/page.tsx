import {
  CalendarDays,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/utils";
import AutoRefresh from "@/components/admin/AutoRefresh";

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!;

const statusConfig: Record<string, { label: string; color: string; icon: React.FC<{ size: number }> }> = {
  CONFIRMED: { label: "Confirmado", color: "var(--info)", icon: CheckCircle2 },
  ARRIVED:   { label: "Chegou",     color: "var(--success)", icon: CheckCircle2 },
  SEATED:    { label: "Sentado",    color: "var(--success)", icon: CheckCircle2 },
  PENDING:   { label: "Pendente",   color: "var(--warning)", icon: AlertCircle },
  NO_SHOW:   { label: "No-Show",    color: "var(--danger)",  icon: XCircle },
  CANCELLED: { label: "Cancelado",  color: "var(--danger)",  icon: XCircle },
  COMPLETED: { label: "Concluído",  color: "var(--foreground-muted)", icon: CheckCircle2 },
};

const originLabel: Record<string, string> = {
  INTERNAL:  "Interno",
  WIDGET:    "Widget",
  GOOGLE:    "Google",
  WHATSAPP:  "WhatsApp",
  INSTAGRAM: "Instagram",
  PHONE:     "Telefone",
};

async function getDashboardData() {
  const today = new Date();
  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const end   = new Date(today); end.setHours(23, 59, 59, 999);

  const [reservations, waitlist, totalCustomers] = await Promise.all([
    prisma.reservation.findMany({
      where: { restaurantId: RESTAURANT_ID, date: { gte: start, lte: end } },
      include: { customer: true, table: true },
      orderBy: { date: "asc" },
    }),
    prisma.waitlistEntry.findMany({
      where: { restaurantId: RESTAURANT_ID, status: { in: ["WAITING", "CALLED"] } },
    }),
    prisma.customer.count({ where: { restaurantId: RESTAURANT_ID } }),
  ]);

  const totalPeople = reservations
    .filter(r => !["CANCELLED", "NO_SHOW"].includes(r.status))
    .reduce((s, r) => s + r.partySize, 0);

  return { reservations, waitlist, totalPeople, totalCustomers };
}

export default async function DashboardPage() {
  const { reservations, waitlist, totalPeople } = await getDashboardData();

  const stats = [
    {
      label: "Reservas Hoje",
      value: String(reservations.length),
      sub: `${reservations.filter(r => r.status === "CONFIRMED").length} confirmadas`,
      positive: true,
      icon: CalendarDays,
      color: "var(--primary)",
    },
    {
      label: "Pessoas Esperadas",
      value: String(totalPeople),
      sub: "Capacidade: 120",
      positive: true,
      icon: Users,
      color: "var(--success)",
    },
    {
      label: "Na Fila Agora",
      value: String(waitlist.length),
      sub: waitlist.length > 0 ? "~30min de espera" : "Fila vazia",
      positive: null,
      icon: Clock,
      color: "var(--warning)",
    },
    {
      label: "Taxa de Ocupação",
      value: `${Math.round((totalPeople / 120) * 100)}%`,
      sub: "Capacidade máxima: 120",
      positive: true,
      icon: TrendingUp,
      color: "var(--info)",
    },
  ];

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30000} />
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Visão geral do dia de hoje
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl p-5 border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{stat.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{stat.value}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{stat.sub}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <Icon size={20} style={{ color: stat.color } as React.CSSProperties} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reservas do dia */}
      <div
        className="rounded-xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
            Reservas de Hoje
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal"
              style={{ background: "var(--primary)20", color: "var(--primary)" }}
            >
              {reservations.length}
            </span>
          </h2>
          <a href="/reservas" className="text-sm hover:opacity-70" style={{ color: "var(--primary)" }}>
            Ver todas
          </a>
        </div>

        {reservations.length === 0 ? (
          <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
            <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma reserva para hoje</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Horário", "Cliente", "Pessoas", "Mesa", "Origem", "Status", "Ações"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium px-5 py-3" style={{ color: "var(--foreground-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservations.map((r, i) => {
                  const s = statusConfig[r.status] ?? statusConfig.CONFIRMED;
                  const StatusIcon = s.icon;
                  return (
                    <tr
                      key={r.id}
                      className="transition-opacity hover:opacity-80 cursor-pointer"
                      style={{ borderBottom: i < reservations.length - 1 ? "1px solid var(--border)" : undefined }}
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {formatTime(r.date)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {r.customer?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <Users size={14} style={{ color: "var(--foreground-muted)" }} />
                          <span className="text-sm" style={{ color: "var(--foreground)" }}>{r.partySize}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                          {r.table?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}
                        >
                          {originLabel[r.origin] ?? r.origin}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: s.color }}><StatusIcon size={14} /></span>
                          <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          className="text-xs px-3 py-1 rounded-lg transition-opacity hover:opacity-70"
                          style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
