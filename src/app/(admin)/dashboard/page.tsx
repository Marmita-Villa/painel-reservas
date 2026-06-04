"use client";

import { CalendarDays, Users, Clock, TrendingUp, ArrowUpRight, DollarSign } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { useEffect, useState, useCallback } from "react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: "Confirmado", color: "var(--info)",    bg: "var(--info-bg)" },
  ARRIVED:   { label: "Chegou",     color: "var(--success)", bg: "var(--success-bg)" },
  SEATED:    { label: "Sentado",    color: "var(--success)", bg: "var(--success-bg)" },
  PENDING:   { label: "Pendente",   color: "var(--warning)", bg: "var(--warning-bg)" },
  NO_SHOW:   { label: "No-Show",    color: "var(--danger)",  bg: "var(--danger-bg)" },
  CANCELLED: { label: "Cancelado",  color: "var(--danger)",  bg: "var(--danger-bg)" },
  COMPLETED: { label: "Concluído",  color: "var(--foreground-muted)", bg: "var(--surface-3)" },
};

const originLabel: Record<string, string> = {
  INTERNAL: "Interno", WIDGET: "Widget", GOOGLE: "Google",
  WHATSAPP: "WhatsApp", INSTAGRAM: "Instagram", PHONE: "Telefone",
};

interface Reservation {
  id: string;
  date: string;
  status: string;
  partySize: number;
  origin: string;
  customer?: { name?: string; phone?: string } | null;
  table?: { name?: string } | null;
}

interface WaitlistEntry { id: string; }

interface BirthdayGuest { id: string | null; name: string; }

interface DashboardData {
  reservations: Reservation[];
  waitlist: WaitlistEntry[];
  totalPeople: number;
  birthdayGuests?: BirthdayGuest[];
  estimatedRevenue?: number;
}

export default function DashboardPage() {
  const { effectiveRestaurantId } = useRestaurant();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = effectiveRestaurantId
        ? `/api/dashboard?restaurantId=${effectiveRestaurantId}`
        : "/api/dashboard";
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, [effectiveRestaurantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => fetchData(), 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const reservations = data?.reservations ?? [];
  const waitlist = data?.waitlist ?? [];
  const totalPeople = data?.totalPeople ?? 0;
  const birthdayGuests = data?.birthdayGuests ?? [];
  const estimatedRevenue = data?.estimatedRevenue ?? 0;
  const confirmed = reservations.filter(r => r.status === "CONFIRMED").length;
  const occupied  = Math.round((totalPeople / 120) * 100);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--primary)" }}>
            Painel de Controle
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Dashboard
          </h1>
        </div>
        <p className="text-sm pb-1" style={{ color: "var(--foreground-muted)" }}>
          {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        </p>
      </div>

      {loading && (
        <div className="text-sm py-4" style={{ color: "var(--foreground-muted)" }}>Carregando...</div>
      )}

      {/* Birthday alert */}
      {birthdayGuests.length > 0 && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl border"
          style={{ background: "var(--warning)15", borderColor: "var(--warning)40" }}
        >
          <span className="text-xl">🎂</span>
          <div>
            <span className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
              Aniversariantes hoje:{" "}
            </span>
            {birthdayGuests.map((g, i) => (
              <span key={g.id ?? i}>
                {i > 0 && <span style={{ color: "var(--foreground-muted)" }}>, </span>}
                <a
                  href="/clientes"
                  className="text-sm font-medium underline-offset-2 hover:underline"
                  style={{ color: "var(--warning)" }}
                >
                  {g.name}
                </a>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: "Reservas Hoje",     value: reservations.length, sub: `${confirmed} confirmadas`,        icon: CalendarDays, accent: "var(--primary)" },
          { label: "Pessoas Esperadas", value: totalPeople,          sub: "Capacidade total: 120",           icon: Users,        accent: "var(--info)" },
          { label: "Na Fila Agora",     value: waitlist.length,      sub: waitlist.length ? "~30 min" : "Fila vazia", icon: Clock, accent: "var(--warning)" },
          { label: "Ocupação",          value: `${occupied}%`,       sub: `${120 - totalPeople} lugares livres`, icon: TrendingUp, accent: "var(--success)" },
          { label: "Receita Estimada",  value: estimatedRevenue > 0 ? `R$ ${estimatedRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—", sub: "Ticket médio configurado", icon: DollarSign, accent: "#10b981" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl p-6 border relative overflow-hidden"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-4 translate-x-4"
                style={{ background: kpi.accent }} />
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{kpi.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${kpi.accent}20` }}>
                  <Icon size={15} style={{ color: kpi.accent } as React.CSSProperties} />
                </div>
              </div>
              <p className="text-4xl font-bold tracking-tight mb-1" style={{ color: "var(--foreground)" }}>
                {kpi.value}
              </p>
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Reservations table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>Reservas de Hoje</h2>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "var(--primary)15", color: "var(--primary)" }}>
              {reservations.length}
            </span>
          </div>
          <a href="/reservas" className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--primary)" }}>
            Ver todas <ArrowUpRight size={14} />
          </a>
        </div>

        {reservations.length === 0 ? (
          <div className="py-20 text-center">
            <CalendarDays size={36} className="mx-auto mb-3 opacity-20" style={{ color: "var(--foreground-muted)" }} />
            <p className="font-medium" style={{ color: "var(--foreground-muted)" }}>
              {loading ? "Carregando reservas..." : "Nenhuma reserva para hoje"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Horário", "Cliente", "Telefone", "Pessoas", "Mesa", "Origem", "Status"].map(h => (
                  <th key={h} className="text-left text-xs font-medium px-6 py-4 uppercase tracking-wide"
                    style={{ color: "var(--foreground-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map((r, i) => {
                const s = statusConfig[r.status] ?? statusConfig.CONFIRMED;
                return (
                  <tr key={r.id} className="group transition-colors cursor-pointer hover:bg-white/[0.02]"
                    style={{ borderBottom: i < reservations.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {formatTime(new Date(r.date))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ background: "var(--surface-3)", color: "var(--foreground-muted)" }}>
                          {r.customer?.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {r.customer?.name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{r.customer?.phone ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} style={{ color: "var(--foreground-muted)" }} />
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{r.partySize}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{r.table?.name ?? "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: "var(--surface-3)", color: "var(--foreground-muted)" }}>
                        {originLabel[r.origin] ?? r.origin}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
