"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Users, CalendarDays, Clock, AlertCircle } from "lucide-react";

type Period = "7d" | "30d" | "3m";

interface KPI {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

interface DayData {
  day: string;
  count: number;
  pct: number;
  busiest: boolean;
}

interface OriginData {
  name: string;
  count: number;
  pct: number;
  color: string;
}

interface HourData {
  hour: string;
  count: number;
  pct: number;
}

interface NoShowEntry {
  id: string;
  customerName: string;
  phone: string;
  date: string;
}

interface ReportData {
  kpis: KPI[];
  byDay: DayData[];
  byOrigin: OriginData[];
  byHour: HourData[];
  recentNoShows: NoShowEntry[];
}

const ORIGIN_COLORS: Record<string, string> = {
  WIDGET: "var(--primary)",
  INTERNAL: "var(--info)",
  GOOGLE: "#ea4335",
  WHATSAPP: "#25d366",
  INSTAGRAM: "#e1306c",
  PHONE: "var(--warning)",
};

const ORIGIN_LABELS: Record<string, string> = {
  WIDGET: "Widget (Site)",
  INTERNAL: "Interno",
  GOOGLE: "Google",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  PHONE: "Telefone",
};

export default function RelatoriosClient({
  initialData,
  initialPeriod,
}: {
  initialData: ReportData;
  initialPeriod: Period;
}) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [data, setData] = useState<ReportData>(initialData);
  const [loading, setLoading] = useState(false);

  async function changePeriod(p: Period) {
    if (p === period) return;
    setLoading(true);
    setPeriod(p);
    try {
      const res = await fetch(`/api/reports?period=${p}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
    setLoading(false);
  }

  const periodLabels: Record<Period, string> = {
    "7d": "7 dias",
    "30d": "30 dias",
    "3m": "3 meses",
  };

  return (
    <div className="space-y-6" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Relatórios
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Análise de desempenho do restaurante
        </p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {(["7d", "30d", "3m"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => changePeriod(p)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: period === p ? "var(--primary)" : "var(--surface)",
              color: period === p ? "white" : "var(--foreground-muted)",
              border: `1px solid ${period === p ? "var(--primary)" : "var(--border)"}`,
            }}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {data.kpis.map((m) => (
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
        {/* By day of week */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <CalendarDays size={16} style={{ color: "var(--primary)" }} />
            Reservas por dia da semana
          </h3>
          {data.byDay.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--foreground-muted)" }}>Sem dados no período</p>
          ) : (
            <div className="space-y-3">
              {data.byDay.map((d) => (
                <div key={d.day}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "var(--foreground)", fontWeight: d.busiest ? 600 : 400 }}>
                      {d.day} {d.busiest && <span className="text-xs ml-1" style={{ color: "var(--primary)" }}>★ mais movimentado</span>}
                    </span>
                    <span style={{ color: "var(--foreground-muted)" }}>{d.count} reservas</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${d.pct}%`, background: d.busiest ? "var(--primary)" : "var(--foreground-dim)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By origin */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <BarChart3 size={16} style={{ color: "var(--primary)" }} />
            Origem das Reservas
          </h3>
          {data.byOrigin.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--foreground-muted)" }}>Sem dados no período</p>
          ) : (
            <div className="space-y-3">
              {data.byOrigin.map((o) => (
                <div key={o.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "var(--foreground)" }}>{o.name}</span>
                    <span style={{ color: "var(--foreground-muted)" }}>{o.count} ({o.pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${o.pct}%`, background: o.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Busiest hours */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Clock size={16} style={{ color: "var(--primary)" }} />
          Horários mais movimentados
        </h3>
        {data.byHour.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--foreground-muted)" }}>Sem dados no período</p>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {data.byHour.map((h) => (
              <div key={h.hour}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "var(--foreground)" }}>{h.hour}</span>
                  <span style={{ color: "var(--foreground-muted)" }}>{h.count}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${h.pct}%`, background: "var(--primary)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent no-shows */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <AlertCircle size={16} style={{ color: "var(--danger)" }} />
          Últimos No-Shows
        </h3>
        {data.recentNoShows.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--foreground-muted)" }}>Nenhum no-show no período 🎉</p>
        ) : (
          <div className="space-y-2">
            {data.recentNoShows.map((ns) => (
              <div
                key={ns.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--surface-2)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{ns.customerName}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{ns.phone}</p>
                </div>
                <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{ns.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
