"use client";

import { useState, useEffect } from "react";
import { X, CalendarDays, Clock, Users, Phone, MapPin, MessageSquare, Sparkles, User, CheckCircle2, XCircle, AlertCircle, Loader2, Edit3 } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: "Confirmado", color: "#2563eb", bg: "#2563eb15" },
  ARRIVED:   { label: "Chegou",     color: "#16a34a", bg: "#16a34a15" },
  SEATED:    { label: "Sentado",    color: "#16a34a", bg: "#16a34a20" },
  PENDING:   { label: "Pendente",   color: "#d97706", bg: "#d9770615" },
  NO_SHOW:   { label: "No-Show",    color: "#dc2626", bg: "#dc262615" },
  CANCELLED: { label: "Cancelado",  color: "#dc2626", bg: "#dc262615" },
  COMPLETED: { label: "Concluído",  color: "#71717a", bg: "#71717a15" },
};

const originLabel: Record<string, string> = {
  INTERNAL: "Interno", WIDGET: "Widget", GOOGLE: "Google",
  WHATSAPP: "WhatsApp", INSTAGRAM: "Instagram", PHONE: "Telefone",
};

// Status transitions available per current status
const statusActions: Record<string, { status: string; label: string; color: string }[]> = {
  PENDING:   [
    { status: "CONFIRMED", label: "Confirmar",   color: "#2563eb" },
    { status: "CANCELLED", label: "Cancelar",    color: "#dc2626" },
  ],
  CONFIRMED: [
    { status: "ARRIVED",   label: "✓ Chegou",    color: "#16a34a" },
    { status: "NO_SHOW",   label: "No-Show",      color: "#dc2626" },
    { status: "CANCELLED", label: "Cancelar",     color: "#6b7280" },
  ],
  ARRIVED: [
    { status: "SEATED",    label: "Sentar",       color: "#16a34a" },
    { status: "NO_SHOW",   label: "No-Show",      color: "#dc2626" },
  ],
  SEATED: [
    { status: "COMPLETED", label: "Concluir",     color: "#6b7280" },
  ],
};

interface Reservation {
  id: string;
  date: string;
  partySize: number;
  status: string;
  origin: string;
  notes?: string | null;
  occasion?: string | null;
  duration?: number;
  confirmToken?: string | null;
  customer?: { id: string; name?: string | null; phone?: string | null; email?: string | null; visitCount?: number; noShowCount?: number; isBlacklisted?: boolean } | null;
  table?: { id: string; name?: string | null } | null;
}

interface Props {
  reservation: Reservation | null;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  return { date, time };
}

export default function ReservationDrawer({ reservation, onClose, onStatusChange }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setNotes(reservation?.notes ?? "");
    setEditingNotes(false);
  }, [reservation?.id]);

  if (!reservation) return null;

  const { date, time } = formatDateTime(reservation.date);
  const s = statusConfig[reservation.status] ?? statusConfig.CONFIRMED;
  const actions = statusActions[reservation.status] ?? [];

  async function handleStatusChange(newStatus: string) {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/reservations/${reservation!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onStatusChange?.(reservation!.id, newStatus);
      }
    } catch {}
    setLoading(null);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      await fetch(`/api/reservations/${reservation!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setEditingNotes(false);
    } catch {}
    setSavingNotes(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{
          width: "min(420px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: "var(--foreground)" }}>
              {reservation.customer?.name ?? "Reserva"}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: s.bg, color: s.color }}>
              {s.label}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-60"
            style={{ color: "var(--foreground-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Quick actions */}
          {actions.length > 0 && (
            <div className="px-6 pt-5 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--foreground-muted)" }}>
                Ações rápidas
              </p>
              <div className="flex gap-2 flex-wrap">
                {actions.map(a => (
                  <button key={a.status} onClick={() => handleStatusChange(a.status)}
                    disabled={loading !== null}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: a.color, color: "#fff" }}>
                    {loading === a.status ? <Loader2 size={13} className="animate-spin" /> : null}
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reservation details */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--foreground-muted)" }}>
              Detalhes
            </p>
            <div className="rounded-xl border overflow-hidden divide-y" style={{ borderColor: "var(--border)" }}>
              {[
                { icon: CalendarDays, label: "Data",     value: date },
                { icon: Clock,        label: "Horário",  value: time },
                { icon: Users,        label: "Pessoas",  value: `${reservation.partySize} pessoa${reservation.partySize > 1 ? "s" : ""}` },
                { icon: MapPin,       label: "Mesa",     value: reservation.table?.name ?? "—" },
                { icon: Phone,        label: "Origem",   value: originLabel[reservation.origin] ?? reservation.origin },
                ...(reservation.occasion ? [{ icon: Sparkles, label: "Ocasião", value: reservation.occasion }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderColor: "var(--border-subtle, var(--border))" }}>
                  <Icon size={14} style={{ color: "var(--foreground-muted)", flexShrink: 0 }} />
                  <span className="text-sm flex-1" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                  <span className="text-sm font-medium text-right" style={{ color: "var(--foreground)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
                Observações
              </p>
              {!editingNotes && (
                <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                  style={{ color: "var(--primary)" }}>
                  <Edit3 size={11} /> Editar
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                <div className="flex gap-2">
                  <button onClick={() => setEditingNotes(false)} className="px-3 py-1.5 rounded-lg text-xs border transition-opacity hover:opacity-70"
                    style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}>Cancelar</button>
                  <button onClick={handleSaveNotes} disabled={savingNotes}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: "var(--primary)", color: "#fff" }}>
                    {savingNotes ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm rounded-xl px-3 py-2.5"
                style={{ background: "var(--surface-2)", color: notes ? "var(--foreground)" : "var(--foreground-muted)", minHeight: 44 }}>
                {notes || "Nenhuma observação"}
              </p>
            )}
          </div>

          {/* Customer info */}
          {reservation.customer && (
            <div className="px-6 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--foreground-muted)" }}>
                Cliente
              </p>
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "var(--primary)20", color: "var(--primary)" }}>
                    {reservation.customer.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {reservation.customer.name}
                      {reservation.customer.isBlacklisted && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: "#dc262615", color: "#dc2626" }}>Blacklist</span>
                      )}
                    </p>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{reservation.customer.phone}</p>
                  </div>
                </div>
                <div className="flex gap-4 pt-1">
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{reservation.customer.visitCount ?? 0}</p>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Visitas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: (reservation.customer.noShowCount ?? 0) >= 2 ? "#dc2626" : "var(--foreground)" }}>
                      {reservation.customer.noShowCount ?? 0}
                    </p>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>No-shows</p>
                  </div>
                </div>
                <a href={`/clientes?id=${reservation.customer.id}`}
                  className="block text-center text-xs py-2 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: "var(--primary)" }}>
                  Ver perfil completo →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
