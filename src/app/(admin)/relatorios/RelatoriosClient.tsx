"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, CalendarDays, Clock, AlertCircle, Download, X, FileDown, Telescope } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "NO_SHOW", label: "No-Show" },
  { value: "ARRIVED", label: "Chegou" },
  { value: "SEATED", label: "Sentado" },
];

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

interface ForecastEntry {
  date: string;
  dayOfWeek: number;
  dayName: string;
  predictedCount: number;
  predictedOccupancy: number;
  confidence: "high" | "medium" | "low";
  weeksWithData: number;
}

interface ForecastData {
  forecast: ForecastEntry[];
  totalCapacity: number;
  hasData: boolean;
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
  const { effectiveRestaurantId } = useRestaurant();
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [data, setData] = useState<ReportData>(initialData);
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [exporting, setExporting] = useState(false);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    if (!effectiveRestaurantId) return;
    setForecastLoading(true);
    fetch(`/api/reports/forecast?restaurantId=${effectiveRestaurantId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setForecast(data))
      .catch(() => setForecast(null))
      .finally(() => setForecastLoading(false));
  }, [effectiveRestaurantId]);

  async function handleExport() {
    if (!effectiveRestaurantId) return;
    setExporting(true);
    try {
      const params = new URLSearchParams({ restaurantId: effectiveRestaurantId });
      if (exportDateFrom) params.set("dateFrom", exportDateFrom);
      if (exportDateTo) params.set("dateTo", exportDateTo);
      if (exportStatus) params.set("status", exportStatus);

      const res = await fetch(`/api/reservations/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reservas-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (err) {
      console.error("Export error:", err);
    }
    setExporting(false);
  }

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Relatórios
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            Análise de desempenho do restaurante
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          <Download size={15} />
          Exportar CSV
        </button>
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

      {/* Forecast 14 days */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Telescope size={16} style={{ color: "var(--primary)" }} />
          Previsão 14 dias
        </h3>

        {forecastLoading ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--foreground-muted)" }}>
            Calculando previsão...
          </p>
        ) : !forecast || !forecast.hasData ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Dados insuficientes
            </p>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
              A previsão estará disponível após o registro de reservas históricas. Continue usando o sistema e os dados serão coletados automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Data", "Dia", "Prev. Reservas", "Ocupação", "", "Confiança"].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--foreground-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast.forecast.map((row) => {
                  const occ = row.predictedOccupancy;
                  const occColor =
                    occ >= 70 ? "#ef4444" : occ >= 40 ? "#f59e0b" : "#22c55e";
                  const occBg =
                    occ >= 70 ? "#ef444418" : occ >= 40 ? "#f59e0b18" : "#22c55e18";

                  const confColor =
                    row.confidence === "high"
                      ? "#22c55e"
                      : row.confidence === "medium"
                      ? "#f59e0b"
                      : "#6b7280";
                  const confBg =
                    row.confidence === "high"
                      ? "#22c55e18"
                      : row.confidence === "medium"
                      ? "#f59e0b18"
                      : "#6b728018";
                  const confLabel =
                    row.confidence === "high"
                      ? "Alta"
                      : row.confidence === "medium"
                      ? "Média"
                      : "Baixa";

                  const dateObj = new Date(row.date + "T12:00:00");
                  const dateFormatted = dateObj.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  });

                  return (
                    <tr
                      key={row.date}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <td className="py-2.5 px-3" style={{ color: "var(--foreground)" }}>
                        {dateFormatted}
                      </td>
                      <td className="py-2.5 px-3" style={{ color: "var(--foreground-muted)" }}>
                        {row.dayName}
                      </td>
                      <td className="py-2.5 px-3 font-medium" style={{ color: "var(--foreground)" }}>
                        {row.predictedCount}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="font-semibold text-xs px-2 py-0.5 rounded-full"
                          style={{ background: occBg, color: occColor }}
                        >
                          {occ}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 w-40">
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: "var(--surface-2)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(occ, 100)}%`, background: occColor }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: confBg, color: confColor }}
                        >
                          {confLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs mt-3" style={{ color: "var(--foreground-muted)" }}>
              Previsão baseada nas últimas 8 semanas de dados históricos. Capacidade total:{" "}
              <strong style={{ color: "var(--foreground)" }}>{forecast.totalCapacity} lugares</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Export CSV Modal */}
      {showExportModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowExportModal(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl p-6 space-y-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDown size={18} style={{ color: "var(--primary)" }} />
                <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Exportar Reservas (CSV)</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "var(--foreground-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                    Data final
                  </label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Status
                </label>
                <select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
                style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: "var(--primary)" }}
              >
                <Download size={14} />
                {exporting ? "Exportando..." : "Exportar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
