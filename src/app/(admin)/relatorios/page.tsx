import { BarChart3, TrendingUp, TrendingDown, Users, CalendarDays } from "lucide-react";

const metrics = [
  { label: "Reservas este mês", value: "312", change: "+18%", positive: true },
  { label: "Taxa de comparecimento", value: "89%", change: "+3%", positive: true },
  { label: "No-shows", value: "34", change: "-8%", positive: true },
  { label: "Novos clientes", value: "67", change: "+22%", positive: true },
];

const topDays = [
  { day: "Sexta-feira", reservations: 58, pct: 100 },
  { day: "Sábado", reservations: 54, pct: 93 },
  { day: "Quinta-feira", reservations: 42, pct: 72 },
  { day: "Domingo", reservations: 38, pct: 65 },
  { day: "Quarta-feira", reservations: 31, pct: 53 },
];

const topOrigins = [
  { name: "Widget (Site)", count: 124, pct: 40, color: "var(--primary)" },
  { name: "Google Reserve", count: 87, pct: 28, color: "var(--info)" },
  { name: "Interno", count: 62, pct: 20, color: "var(--success)" },
  { name: "WhatsApp", count: 25, pct: 8, color: "var(--warning)" },
  { name: "Instagram", count: 14, pct: 4, color: "var(--danger)" },
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Relatórios
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Análise de desempenho — últimos 30 dias
        </p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {["7 dias", "30 dias", "3 meses", "12 meses"].map((p, i) => (
          <button
            key={p}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: i === 1 ? "var(--primary)" : "var(--surface)",
              color: i === 1 ? "white" : "var(--foreground-muted)",
              border: `1px solid ${i === 1 ? "var(--primary)" : "var(--border)"}`,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-5 border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{m.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{m.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {m.positive ? (
                <TrendingUp size={13} style={{ color: "var(--success)" }} />
              ) : (
                <TrendingDown size={13} style={{ color: "var(--danger)" }} />
              )}
              <span className="text-xs" style={{ color: m.positive ? "var(--success)" : "var(--danger)" }}>
                {m.change} vs período anterior
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top days */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <CalendarDays size={16} style={{ color: "var(--primary)" }} />
            Dias com mais reservas
          </h3>
          <div className="space-y-3">
            {topDays.map((d) => (
              <div key={d.day}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "var(--foreground)" }}>{d.day}</span>
                  <span style={{ color: "var(--foreground-muted)" }}>{d.reservations} reservas</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${d.pct}%`, background: "var(--primary)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Origin breakdown */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <BarChart3 size={16} style={{ color: "var(--primary)" }} />
            Origem das Reservas
          </h3>
          <div className="space-y-3">
            {topOrigins.map((o) => (
              <div key={o.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "var(--foreground)" }}>{o.name}</span>
                  <span style={{ color: "var(--foreground-muted)" }}>{o.count} ({o.pct}%)</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${o.pct * 2.5}%`, background: o.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
