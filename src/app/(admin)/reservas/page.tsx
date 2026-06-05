"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Filter, Users, CheckCircle2, XCircle, AlertCircle, MessageCircle, List, LayoutList, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useReserva } from "@/components/admin/ReservaProvider";
import { useRestaurant } from "@/contexts/RestaurantContext";
import ReservationDrawer from "@/components/admin/ReservationDrawer";

const statusConfig: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmado", color: "var(--info)" },
  ARRIVED:   { label: "Chegou",     color: "var(--success)" },
  SEATED:    { label: "Sentado",    color: "var(--success)" },
  PENDING:   { label: "Pendente",   color: "var(--warning)" },
  NO_SHOW:   { label: "No-Show",    color: "var(--danger)" },
  CANCELLED: { label: "Cancelado",  color: "var(--danger)" },
  COMPLETED: { label: "Concluído",  color: "var(--foreground-muted)" },
};

const statusBg: Record<string, string> = {
  CONFIRMED: "#3b82f620",
  ARRIVED:   "#22c55e20",
  SEATED:    "#22c55e30",
  PENDING:   "#f59e0b20",
  NO_SHOW:   "#ef444420",
  CANCELLED: "#ef444420",
  COMPLETED: "#71717a20",
};

const originLabel: Record<string, string> = {
  INTERNAL: "Interno", WIDGET: "Widget", GOOGLE: "Google",
  WHATSAPP: "WhatsApp", INSTAGRAM: "Instagram", PHONE: "Telefone",
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

const DAY_START = 11; // 11:00
const DAY_END   = 23; // 23:00
const HOUR_PX   = 80; // px per hour

function getMinutesFromDayStart(dateStr: string): number {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  return (h - DAY_START) * 60 + m;
}

// ── Timeline View ──────────────────────────────────────────────
function TimelineView({ reservations }: { reservations: any[] }) {
  const hours = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i);
  const totalW = (DAY_END - DAY_START) * HOUR_PX;

  // Group by table
  const tableMap = new Map<string, { label: string; rows: any[] }>();
  for (const r of reservations) {
    const key = r.tableId ?? "__none__";
    const label = r.table?.name ?? "Sem mesa";
    if (!tableMap.has(key)) tableMap.set(key, { label, rows: [] });
    tableMap.get(key)!.rows.push(r);
  }
  const groups = Array.from(tableMap.entries());

  const [tooltip, setTooltip] = useState<{ r: any; x: number; y: number } | null>(null);

  if (reservations.length === 0) {
    return (
      <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
        <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhuma reserva para esta data</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>
      <div style={{ minWidth: totalW + 140 }}>
        {/* Header row */}
        <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 140, flexShrink: 0, padding: "10px 12px", fontSize: 12, color: "var(--foreground-muted)", fontWeight: 600 }}>Mesa</div>
          <div style={{ position: "relative", width: totalW, flexShrink: 0 }}>
            <div className="flex">
              {hours.map(h => (
                <div key={h} style={{ width: HOUR_PX, borderLeft: "1px solid var(--border)", padding: "10px 8px", fontSize: 12, fontWeight: 600, color: "var(--foreground-muted)", flexShrink: 0 }}>
                  {String(h).padStart(2,"0")}:00
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        {groups.map(([key, group]) => (
          <div key={key} className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 140, flexShrink: 0, padding: "12px", fontSize: 13, fontWeight: 500, color: "var(--foreground)", display: "flex", alignItems: "center" }}>
              {group.label}
            </div>
            <div style={{ position: "relative", width: totalW, flexShrink: 0, height: 52, overflow: "visible" }}>
              {/* Hour grid lines */}
              {hours.map(h => (
                <div key={h} style={{ position: "absolute", left: (h - DAY_START) * HOUR_PX, top: 0, bottom: 0, borderLeft: "1px solid var(--border)", opacity: 0.4 }} />
              ))}
              {/* Reservation blocks */}
              {group.rows.map(r => {
                const offsetMin = getMinutesFromDayStart(r.date);
                const duration = r.duration ?? 90;
                const leftPx = (offsetMin / 60) * HOUR_PX;
                const widthPx = Math.max((duration / 60) * HOUR_PX, 30);
                const bg = statusBg[r.status] ?? "#3b82f620";
                const color = statusConfig[r.status]?.color ?? "var(--info)";
                const name = r.customer?.name ?? "—";
                const shortName = name.length > 10 ? name.slice(0, 10) + "…" : name;
                return (
                  <div
                    key={r.id}
                    onClick={(e) => setTooltip(tooltip?.r.id === r.id ? null : { r, x: e.clientX, y: e.clientY })}
                    style={{
                      position: "absolute",
                      left: leftPx + 2,
                      top: 6,
                      width: widthPx - 4,
                      height: 40,
                      borderRadius: 6,
                      background: bg,
                      border: `1.5px solid ${color}`,
                      padding: "4px 7px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      overflow: "hidden",
                      zIndex: 1,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color, lineHeight: 1.2, whiteSpace: "nowrap" }}>{shortName}</span>
                    <span style={{ fontSize: 10, color, opacity: 0.8, display: "flex", alignItems: "center", gap: 2, lineHeight: 1.2 }}>
                      <Users size={9} /> {r.partySize}p
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: Math.min(tooltip.x + 12, window.innerWidth - 220),
            top: tooltip.y + 12,
            zIndex: 1000,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            minWidth: 200,
          }}
          onClick={() => setTooltip(null)}
        >
          <p style={{ fontWeight: 700, fontSize: 14, color: "var(--foreground)", marginBottom: 4 }}>{tooltip.r.customer?.name ?? "—"}</p>
          <p style={{ fontSize: 12, color: "var(--foreground-muted)" }}>{formatTime(tooltip.r.date)} · {tooltip.r.partySize} pessoas</p>
          <p style={{ fontSize: 12, color: "var(--foreground-muted)" }}>Mesa: {tooltip.r.table?.name ?? "—"}</p>
          <p style={{ fontSize: 12, color: "var(--foreground-muted)" }}>Status: <span style={{ color: statusConfig[tooltip.r.status]?.color }}>{statusConfig[tooltip.r.status]?.label}</span></p>
          {tooltip.r.notes && <p style={{ fontSize: 11, color: "var(--foreground-muted)", marginTop: 4, fontStyle: "italic" }}>{tooltip.r.notes}</p>}
        </div>
      )}
    </div>
  );
}

// ── Calendar View ──────────────────────────────────────────────
function CalendarView({
  restaurantId,
  onSelectDay,
}: {
  restaurantId: string | null;
  onSelectDay: (date: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);

  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      const params = new URLSearchParams({ year: String(viewYear), month: String(viewMonth + 1) });
      if (restaurantId) params.set("restaurantId", restaurantId);
      const res = await fetch(`/api/reservations/calendar?${params}`);
      const data = await res.json();
      setCounts(data);
    } catch {
      setCounts({});
    } finally {
      setLoadingCounts(false);
    }
  }, [viewYear, viewMonth, restaurantId]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getFirstDayOfWeek(year: number, month: number) {
    let d = new Date(year, month, 1).getDay(); // 0=Sun
    return (d + 6) % 7; // convert to Mon=0
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDow + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const dayNames = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(m => m + 1);
  }

  function getDotColor(count: number): string {
    if (count === 0) return "var(--success)";
    if (count <= 3)  return "var(--warning)";
    return "var(--danger)";
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:opacity-70" style={{ background: "var(--surface-2)" }}>
          <ChevronLeft size={18} style={{ color: "var(--foreground-muted)" }} />
        </button>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--foreground)" }}>
          {monthNames[viewMonth]} {viewYear}
        </h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:opacity-70" style={{ background: "var(--surface-2)" }}>
          <ChevronRight size={18} style={{ color: "var(--foreground-muted)" }} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--foreground-muted)", padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const count = counts[dateStr] ?? 0;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={i}
              onClick={() => onSelectDay(dateStr)}
              style={{
                borderRadius: 8,
                padding: "8px 4px",
                background: isToday ? "var(--primary)10" : "transparent",
                border: isToday ? "2px solid var(--primary)" : "2px solid transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                transition: "background 0.15s",
              }}
              className="hover:opacity-80"
            >
              <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: "var(--foreground)" }}>{day}</span>
              {count > 0 && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  background: getDotColor(count) + "22",
                  color: getDotColor(count),
                  borderRadius: 10,
                  padding: "1px 6px",
                  lineHeight: 1.5,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {loadingCounts && <p style={{ textAlign: "center", fontSize: 12, color: "var(--foreground-muted)", marginTop: 8 }}>Carregando…</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
type ViewMode = "list" | "timeline" | "calendar";

export default function ReservasPage() {
  const { openModal } = useReserva();
  const { effectiveRestaurantId } = useRestaurant();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (effectiveRestaurantId) params.set("restaurantId", effectiveRestaurantId);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/reservations?${params}`);
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [date, statusFilter, effectiveRestaurantId]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const filtered = originFilter
    ? reservations.filter(r => r.origin === originFilter)
    : reservations;

  function handleCalendarSelectDay(d: string) {
    setDate(d);
    setViewMode("list");
  }

  const viewButtons: { key: ViewMode; icon: React.ReactNode; label: string }[] = [
    { key: "list",     icon: <LayoutList size={15} />, label: "Lista" },
    { key: "timeline", icon: <List size={15} />,       label: "Timeline" },
    { key: "calendar", icon: <Calendar size={15} />,   label: "Calendário" },
  ];

  function handleStatusChange(id: string, newStatus: string) {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    setSelectedReservation((prev: any) => prev?.id === id ? { ...prev, status: newStatus } : prev);
  }

  return (
    <>
    <ReservationDrawer
      reservation={selectedReservation}
      onClose={() => setSelectedReservation(null)}
      onStatusChange={handleStatusChange}
    />
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Reservas</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            {filtered.length} reserva{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {viewButtons.map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                title={v.label}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  background: viewMode === v.key ? "var(--primary)" : "var(--surface)",
                  color: viewMode === v.key ? "white" : "var(--foreground-muted)",
                  borderRight: v.key !== "calendar" ? "1px solid var(--border)" : undefined,
                }}
              >
                {v.icon}
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--primary)" }}
          >
            + Nova Reserva
          </button>
        </div>
      </div>

      {/* Filters (hide for calendar view) */}
      {viewMode !== "calendar" && (
        <div className="flex items-center gap-3 p-4 rounded-xl border flex-wrap"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <CalendarDays size={18} style={{ color: "var(--foreground-muted)" }} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <option value="">Todos os status</option>
            {Object.entries(statusConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <option value="">Todas as origens</option>
            {Object.entries(originLabel).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={fetchReservations}
            className="ml-auto px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--primary)", color: "white" }}
          >
            Atualizar
          </button>
        </div>
      )}

      {/* Content */}
      {viewMode === "calendar" ? (
        <CalendarView restaurantId={effectiveRestaurantId ?? null} onSelectDay={handleCalendarSelectDay} />
      ) : viewMode === "timeline" ? (

        loading ? (
          <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
            <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Buscando reservas...</p>
          </div>
        ) : (
          <TimelineView reservations={filtered} />
        )
      ) : (
        /* List view */
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {loading ? (
            <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
              <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Buscando reservas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
              <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma reserva para esta data</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Horário", "Cliente", "Pessoas", "Mesa", "Origem", "Status", ""].map(h => (
                    <th key={h} className="text-left text-xs font-medium px-5 py-3" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const s = statusConfig[r.status] ?? statusConfig.CONFIRMED;
                  return (
                    <tr key={r.id} className="hover:opacity-80 cursor-pointer"
                      onClick={() => setSelectedReservation(r)}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : undefined }}>
                      <td className="px-5 py-3">
                        <span className="font-mono text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {formatTime(r.date)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{r.customer?.name ?? "—"}</p>
                          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{r.customer?.phone ?? ""}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <Users size={14} style={{ color: "var(--foreground-muted)" }} />
                          <span className="text-sm" style={{ color: "var(--foreground)" }}>{r.partySize}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{r.table?.name ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full"
                          style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                          {originLabel[r.origin] ?? r.origin}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                      </td>
                      <td className="px-5 py-3">
                        {r.confirmToken && (
                          <MessageCircle size={14} aria-label="WhatsApp enviado" style={{ color: "#25d366" }} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
    </>
  );
}
