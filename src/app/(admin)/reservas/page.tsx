"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Filter, Users, CheckCircle2, XCircle, AlertCircle, MessageCircle } from "lucide-react";
import { useReserva } from "@/components/admin/ReservaProvider";
import { useRestaurant } from "@/contexts/RestaurantContext";

const statusConfig: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmado", color: "var(--info)" },
  ARRIVED:   { label: "Chegou",     color: "var(--success)" },
  SEATED:    { label: "Sentado",    color: "var(--success)" },
  PENDING:   { label: "Pendente",   color: "var(--warning)" },
  NO_SHOW:   { label: "No-Show",    color: "var(--danger)" },
  CANCELLED: { label: "Cancelado",  color: "var(--danger)" },
  COMPLETED: { label: "Concluído",  color: "var(--foreground-muted)" },
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

export default function ReservasPage() {
  const { openModal } = useReserva();
  const { effectiveRestaurantId } = useRestaurant();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Reservas</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            {filtered.length} reserva{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          + Nova Reserva
        </button>
      </div>

      {/* Filters */}
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

      {/* Table */}
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
    </div>
  );
}
