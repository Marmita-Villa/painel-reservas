"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, Search, Star, AlertTriangle, X, Ban, Utensils, Heart, MapPin, FileText,
  Bell, ChevronLeft, ChevronRight, CalendarDays, History, MessageSquare, User,
  Shield, TrendingUp, UserX, Cake, Plus,
} from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Reservation {
  id: string;
  date: string;
  status: string;
  partySize: number;
  occasion?: string | null;
  table?: { name?: string } | null;
}

interface NotificationLog {
  id: string;
  type: string;
  phone: string;
  success: boolean;
  sentAt: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  birthday?: string | null;
  visitCount: number;
  noShowCount: number;
  tags: string[];
  isBlacklisted: boolean;
  blacklistReason?: string | null;
  allergies?: string | null;
  preferences?: string | null;
  favoriteTable?: string | null;
  internalNotes?: string | null;
  createdAt?: string;
  lastVisit?: string | null;
  reservations?: Reservation[];
  notificationLogs?: NotificationLog[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  CONFIRMED: "Confirmado", ARRIVED: "Chegou", SEATED: "Sentado",
  PENDING: "Pendente", NO_SHOW: "No-Show", CANCELLED: "Cancelado", COMPLETED: "Concluído",
};

const notifTypeLabel: Record<string, string> = {
  CONFIRMATION: "Confirmação", REMINDER_24H: "Lembrete 24h", REMINDER_2H: "Lembrete 2h",
  CANCELLATION: "Cancelamento", POST_VISIT: "Pós-visita", WAITLIST_READY: "Fila de espera",
};

const notifTypeColor: Record<string, { bg: string; color: string }> = {
  CONFIRMATION:   { bg: "#dbeafe", color: "#2563eb" },
  REMINDER_24H:   { bg: "#fef3c7", color: "#d97706" },
  REMINDER_2H:    { bg: "#ffedd5", color: "#ea580c" },
  CANCELLATION:   { bg: "#fee2e2", color: "#dc2626" },
  POST_VISIT:     { bg: "#dcfce7", color: "#16a34a" },
  WAITLIST_READY: { bg: "#f3e8ff", color: "#9333ea" },
};

const statusDotColor: Record<string, string> = {
  COMPLETED: "#16a34a", ARRIVED: "#16a34a",
  NO_SHOW: "#dc2626", CANCELLED: "#dc2626",
  CONFIRMED: "#2563eb",
  PENDING: "#d97706",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isBirthday(birthday: string | null | undefined): boolean {
  if (!birthday) return false;
  const today = new Date();
  const bday = new Date(birthday);
  return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
}

function isBirthdayThisMonth(birthday: string | null | undefined): boolean {
  if (!birthday) return false;
  return new Date(birthday).getMonth() === new Date().getMonth();
}

function getScore(c: Customer): { label: string; bg: string; color: string } {
  if (c.isBlacklisted)          return { label: "Bloqueado", bg: "#fee2e2", color: "#dc2626" };
  if (c.noShowCount >= 2)        return { label: "Risco",     bg: "#fef3c7", color: "#d97706" };
  if (c.visitCount >= 5 && c.noShowCount === 0) return { label: "Fiel",    bg: "#dcfce7", color: "#16a34a" };
  if (c.visitCount >= 2)         return { label: "Regular",   bg: "#dbeafe", color: "#2563eb" };
  return                                 { label: "Novo",      bg: "#f4f4f5", color: "#71717a" };
}

function getStarCount(visits: number): number {
  if (visits >= 21) return 5;
  if (visits >= 11) return 4;
  if (visits >= 6)  return 3;
  if (visits >= 3)  return 2;
  if (visits >= 1)  return 1;
  return 0;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(dateStr));
}

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ count, visits }: { count: number; visits: number }) {
  return (
    <div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={12}
            fill={i < count ? "var(--primary)" : "none"}
            style={{ color: i < count ? "var(--primary)" : "var(--border)" }}
          />
        ))}
      </div>
      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{visits} visita{visits !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ customer }: { customer: Customer }) {
  const score = getScore(customer);
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: score.bg, color: score.color }}
    >
      {score.label}
    </span>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function CalendarTab({ reservations }: { reservations: Reservation[] }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const reservationMap = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach(r => {
      const key = new Date(r.date).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [reservations]);

  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calMonth]);

  const todayStr = new Date().toISOString().slice(0, 10);

  function cellKey(day: number) {
    const y = calMonth.getFullYear();
    const m = String(calMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const selectedReservations = selectedDay ? (reservationMap.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() - 1); setCalMonth(d); setSelectedDay(null); }}
          className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
        >
          <ChevronLeft size={15} />
        </button>
        <p className="text-sm font-semibold capitalize" style={{ color: "var(--foreground)" }}>
          {formatMonthYear(calMonth)}
        </p>
        <button
          onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() + 1); setCalMonth(d); setSelectedDay(null); }}
          className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(wd => (
          <div key={wd} className="text-center text-xs font-medium py-1" style={{ color: "var(--foreground-muted)" }}>
            {wd}
          </div>
        ))}
        {calendarDays.map((day, idx) => {
          const key = day ? cellKey(day) : null;
          const dayReservations = key ? (reservationMap.get(key) ?? []) : [];
          const isToday = key === todayStr;
          const isSelected = key === selectedDay;
          const hasReservations = dayReservations.length > 0;

          return (
            <div
              key={idx}
              onClick={() => { if (day && hasReservations) setSelectedDay(isSelected ? null : key); }}
              className="flex flex-col items-center justify-start rounded-lg p-1 transition-all"
              style={{
                minHeight: "44px",
                cursor: day && hasReservations ? "pointer" : "default",
                background: isSelected
                  ? "var(--primary)15"
                  : hasReservations
                  ? "var(--surface-2)"
                  : "transparent",
                border: isToday
                  ? "2px solid var(--primary)"
                  : isSelected
                  ? "1px solid var(--primary)"
                  : "1px solid transparent",
              }}
            >
              {day && (
                <>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: isToday ? "var(--primary)" : day ? "var(--foreground)" : "var(--foreground-muted)",
                    }}
                  >
                    {day}
                  </span>
                  {hasReservations && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayReservations.slice(0, 3).map((r, i) => (
                        <div
                          key={i}
                          className="rounded-full"
                          style={{
                            width: "6px", height: "6px",
                            background: statusDotColor[r.status] ?? "#71717a",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {[
          { label: "Concluída/Chegou", color: "#16a34a" },
          { label: "Confirmada", color: "#2563eb" },
          { label: "Pendente", color: "#d97706" },
          { label: "No-Show/Cancelada", color: "#dc2626" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="rounded-full" style={{ width: "8px", height: "8px", background: l.color }} />
            <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Selected day reservations */}
      {selectedDay && (
        <div className="space-y-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
            {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(selectedDay + "T00:00:00Z"))}
          </p>
          {selectedReservations.map(r => (
            <div
              key={r.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                  {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(r.date))}
                  {r.table?.name ? ` · ${r.table.name}` : ""}
                  {" · "}{r.partySize} pessoa{r.partySize !== 1 ? "s" : ""}
                </p>
                {r.occasion && <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{r.occasion}</p>}
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: (statusDotColor[r.status] ?? "#71717a") + "22",
                  color: statusDotColor[r.status] ?? "#71717a",
                }}
              >
                {statusLabel[r.status] ?? r.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {reservations.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: "var(--foreground-muted)" }}>
          Nenhuma reserva registrada
        </p>
      )}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({ reservations }: { reservations: Reservation[] }) {
  if (reservations.length === 0) {
    return <p className="text-sm text-center py-8" style={{ color: "var(--foreground-muted)" }}>Sem histórico</p>;
  }

  const sorted = [...reservations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const byYear: Record<number, Reservation[]> = {};
  sorted.forEach(r => {
    const y = new Date(r.date).getFullYear();
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(r);
  });
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
  const multipleYears = years.length > 1;

  return (
    <div className="space-y-4">
      {years.map(year => (
        <div key={year}>
          {multipleYears && (
            <p className="text-xs font-semibold mb-2 px-1" style={{ color: "var(--foreground-muted)" }}>{year}</p>
          )}
          <div className="space-y-2">
            {byYear[year].map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                    {formatDateTime(r.date)}
                    {r.table?.name ? ` · ${r.table.name}` : ""}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                    {r.partySize} pessoa{r.partySize !== 1 ? "s" : ""}
                    {r.occasion ? ` · ${r.occasion}` : ""}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: (statusDotColor[r.status] ?? "#71717a") + "22",
                    color: statusDotColor[r.status] ?? "#71717a",
                  }}
                >
                  {statusLabel[r.status] ?? r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Communications Tab ───────────────────────────────────────────────────────

function CommunicationsTab({ logs }: { logs: NotificationLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-center py-8" style={{ color: "var(--foreground-muted)" }}>Nenhuma comunicação enviada</p>;
  }
  return (
    <div className="space-y-2">
      {logs.map(log => {
        const typeStyle = notifTypeColor[log.type] ?? { bg: "#f4f4f5", color: "#71717a" };
        return (
          <div
            key={log.id}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start gap-3">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5"
                style={{ background: typeStyle.bg, color: typeStyle.color }}
              >
                {notifTypeLabel[log.type] ?? log.type}
              </span>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{log.phone}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                  {formatDateTime(log.sentAt)}
                </p>
              </div>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{
                background: log.success ? "#dcfce7" : "#fee2e2",
                color: log.success ? "#16a34a" : "#dc2626",
              }}
            >
              {log.success ? "Enviado" : "Falhou"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

interface ProfileTabProps {
  customer: Customer;
  editAllergies: string; setEditAllergies: (v: string) => void;
  editPreferences: string; setEditPreferences: (v: string) => void;
  editFavoriteTable: string; setEditFavoriteTable: (v: string) => void;
  editInternalNotes: string; setEditInternalNotes: (v: string) => void;
  editBlacklisted: boolean; setEditBlacklisted: (v: boolean) => void;
  editBlacklistReason: string; setEditBlacklistReason: (v: string) => void;
  editTags: string[]; setEditTags: (v: string[]) => void;
  saving: boolean; onSave: () => void;
}

function ProfileTab({
  customer, editAllergies, setEditAllergies, editPreferences, setEditPreferences,
  editFavoriteTable, setEditFavoriteTable, editInternalNotes, setEditInternalNotes,
  editBlacklisted, setEditBlacklisted, editBlacklistReason, setEditBlacklistReason,
  editTags, setEditTags, saving, onSave,
}: ProfileTabProps) {
  const [newTag, setNewTag] = useState("");

  function addTag() {
    const t = newTag.trim();
    if (t && !editTags.includes(t)) setEditTags([...editTags, t]);
    setNewTag("");
  }

  return (
    <div className="space-y-5">
      {/* Read-only contact info */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>Informações de Contato</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--foreground-muted)" }}>Telefone</p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{customer.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--foreground-muted)" }}>Email</p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{customer.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--foreground-muted)" }}>Aniversário</p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {customer.birthday
                ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" }).format(new Date(customer.birthday + "T00:00:00Z"))
                : "—"}
              {isBirthday(customer.birthday) && " 🎂"}
            </p>
          </div>
          {customer.createdAt && (
            <div>
              <p className="text-xs mb-0.5" style={{ color: "var(--foreground-muted)" }}>Membro desde</p>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(customer.createdAt))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {editTags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: tag === "VIP" ? "#fef3c7" : "var(--surface-2)",
                color: tag === "VIP" ? "#d97706" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {tag}
              <button
                onClick={() => setEditTags(editTags.filter(t => t !== tag))}
                className="hover:opacity-70 transition-opacity"
                style={{ color: "var(--foreground-muted)" }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTag()}
              placeholder="Nova tag"
              className="text-xs px-2.5 py-1 rounded-full outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", width: "90px" }}
            />
            <button
              onClick={addTag}
              className="p-1 rounded-full hover:opacity-70 transition-opacity"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}
            >
              <Plus size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div>
        <label className="flex items-center gap-1.5 text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
          <Utensils size={12} /> Alergias / Restrições alimentares
        </label>
        <textarea
          value={editAllergies}
          onChange={e => setEditAllergies(e.target.value)}
          placeholder="Ex: Intolerante a lactose, sem glúten..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
          <Heart size={12} /> Preferências
        </label>
        <textarea
          value={editPreferences}
          onChange={e => setEditPreferences(e.target.value)}
          placeholder="Ex: Prefere mesa ao fundo, vinho tinto..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
          <MapPin size={12} /> Mesa favorita
        </label>
        <input
          type="text"
          value={editFavoriteTable}
          onChange={e => setEditFavoriteTable(e.target.value)}
          placeholder="Ex: Mesa 7, Varanda"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
          <FileText size={12} /> Notas internas
        </label>
        <textarea
          value={editInternalNotes}
          onChange={e => setEditInternalNotes(e.target.value)}
          placeholder="Informações internas sobre o cliente..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
      </div>

      {/* Blacklist toggle */}
      <div
        className="flex items-start justify-between p-4 rounded-xl border"
        style={{ borderColor: editBlacklisted ? "#fca5a550" : "var(--border)", background: editBlacklisted ? "#fee2e210" : "var(--surface-2)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: editBlacklisted ? "#dc2626" : "var(--foreground)" }}>
            Lista negra
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            Bloquear reservas futuras deste cliente
          </p>
        </div>
        <input type="checkbox" checked={editBlacklisted} onChange={e => setEditBlacklisted(e.target.checked)} className="accent-red-500 mt-1" />
      </div>

      {editBlacklisted && (
        <div>
          <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>Motivo da lista negra</label>
          <input
            type="text"
            value={editBlacklistReason}
            onChange={e => setEditBlacklistReason(e.target.value)}
            placeholder="Ex: Múltiplos no-shows, comportamento inadequado..."
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>
      )}

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
        style={{ background: "var(--primary)" }}
      >
        {saving ? "Salvando..." : "Salvar perfil"}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterType = "all" | "vip" | "risk" | "blacklist" | "birthday";
type SortType = "name" | "visits" | "lastVisit" | "newest";

export default function ClientesPage() {
  const { effectiveRestaurantId } = useRestaurant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("visits");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "calendar" | "history" | "communications">("profile");

  // Edit state
  const [editAllergies, setEditAllergies] = useState("");
  const [editPreferences, setEditPreferences] = useState("");
  const [editFavoriteTable, setEditFavoriteTable] = useState("");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [editBlacklisted, setEditBlacklisted] = useState(false);
  const [editBlacklistReason, setEditBlacklistReason] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);

  const fetchCustomers = useCallback(async () => {
    if (!effectiveRestaurantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?restaurantId=${effectiveRestaurantId}`);
      if (res.ok) setCustomers(await res.json());
    } catch {}
    setLoading(false);
  }, [effectiveRestaurantId]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  async function openProfile(c: Customer) {
    setPanelLoading(true);
    setSelectedCustomer(c);
    setActiveTab("profile");
    setEditAllergies(c.allergies ?? "");
    setEditPreferences(c.preferences ?? "");
    setEditFavoriteTable(c.favoriteTable ?? "");
    setEditInternalNotes(c.internalNotes ?? "");
    setEditBlacklisted(c.isBlacklisted);
    setEditBlacklistReason(c.blacklistReason ?? "");
    setEditTags(c.tags ?? []);
    try {
      const res = await fetch(`/api/customers/${c.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
        setEditAllergies(data.allergies ?? "");
        setEditPreferences(data.preferences ?? "");
        setEditFavoriteTable(data.favoriteTable ?? "");
        setEditInternalNotes(data.internalNotes ?? "");
        setEditBlacklisted(data.isBlacklisted);
        setEditBlacklistReason(data.blacklistReason ?? "");
        setEditTags(data.tags ?? []);
      }
    } catch {}
    setPanelLoading(false);
  }

  async function saveProfile() {
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allergies: editAllergies || null,
          preferences: editPreferences || null,
          favoriteTable: editFavoriteTable || null,
          internalNotes: editInternalNotes || null,
          isBlacklisted: editBlacklisted,
          blacklistReason: editBlacklistReason || null,
          tags: editTags,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedCustomer(prev => prev ? { ...prev, ...updated } : null);
        setCustomers(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      }
    } catch {}
    setSaving(false);
  }

  // ── Stats ──
  const now = new Date();
  const stats = useMemo(() => {
    const total = customers.length;
    const vip = customers.filter(c => c.tags.includes("VIP") || c.visitCount >= 5).length;
    const blacklisted = customers.filter(c => c.isBlacklisted).length;
    const thisMonth = customers.filter(c => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    return { total, vip, blacklisted, thisMonth };
  }, [customers]);

  // ── Filtered & sorted list ──
  const displayList = useMemo(() => {
    let list = customers.filter(c => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !(c.phone ?? "").includes(q) && !(c.email ?? "").toLowerCase().includes(q)) return false;
      }
      if (filter === "vip") return c.tags.includes("VIP") || c.visitCount >= 5;
      if (filter === "risk") return c.noShowCount >= 2 && !c.isBlacklisted;
      if (filter === "blacklist") return c.isBlacklisted;
      if (filter === "birthday") return isBirthdayThisMonth(c.birthday);
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "visits") return b.visitCount - a.visitCount;
      if (sort === "lastVisit") {
        const da = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        const db = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
        return db - da;
      }
      if (sort === "newest") {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      }
      return 0;
    });

    return list;
  }, [customers, search, filter, sort]);

  const TABS = [
    { key: "profile" as const, label: "Perfil", icon: User },
    { key: "calendar" as const, label: "Calendário", icon: CalendarDays },
    { key: "history" as const, label: "Histórico", icon: History },
    { key: "communications" as const, label: "Comunicações", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Clientes</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          CRM integrado — histórico e perfil de cada cliente
        </p>
      </div>

      {/* SECTION 1 — Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total de Clientes", value: stats.total, icon: Users, color: "var(--primary)" },
          { label: "Clientes VIP", value: stats.vip, icon: Star, color: "#d97706" },
          { label: "Blacklist", value: stats.blacklisted, icon: UserX, color: "#dc2626" },
          { label: "Novos este mês", value: stats.thisMonth, icon: TrendingUp, color: "#16a34a" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex items-center gap-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: color + "15" }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 2 — Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1.5">
          {([
            { key: "all", label: "Todos" },
            { key: "vip", label: "VIP" },
            { key: "risk", label: "Risco" },
            { key: "blacklist", label: "Blacklist" },
            { key: "birthday", label: "Aniversariantes" },
          ] as { key: FilterType; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="text-xs px-3 py-2 rounded-lg font-medium transition-all"
              style={{
                background: filter === f.key ? "var(--primary)" : "var(--surface)",
                color: filter === f.key ? "white" : "var(--foreground-muted)",
                border: `1px solid ${filter === f.key ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortType)}
          className="text-xs px-3 py-2 rounded-lg outline-none font-medium"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}
        >
          <option value="visits">Mais visitas</option>
          <option value="name">Nome A-Z</option>
          <option value="lastVisit">Última visita</option>
          <option value="newest">Novo primeiro</option>
        </select>
      </div>

      {/* SECTION 3 — Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {loading ? (
          <div className="py-14 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>Carregando clientes...</div>
        ) : displayList.length === 0 ? (
          <div className="py-14 text-center">
            <Users size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--foreground-muted)" }} />
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Nenhum cliente encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Cliente", "Contato", "Fidelidade", "Última visita", "No-Shows", "Score", "Ações"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold px-5 py-3" style={{ color: "var(--foreground-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayList.map((c, i) => (
                <tr
                  key={c.id}
                  className="transition-colors"
                  style={{
                    borderBottom: i < displayList.length - 1 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  {/* Cliente */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: c.isBlacklisted ? "#dc2626" : "var(--primary)" }}
                      >
                        {c.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{c.name}</span>
                          {isBirthday(c.birthday) && <span title="Aniversário hoje!"><Cake size={13} style={{ color: "#d97706" }} /></span>}
                        </div>
                        {c.isBlacklisted && (
                          <span
                            className="text-xs font-medium flex items-center gap-0.5 mt-0.5"
                            style={{ color: "#dc2626" }}
                          >
                            <Ban size={10} /> Blacklist
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contato */}
                  <td className="px-5 py-4">
                    <p className="text-sm" style={{ color: "var(--foreground)" }}>{c.phone ?? "—"}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{c.email ?? ""}</p>
                  </td>

                  {/* Fidelidade */}
                  <td className="px-5 py-4">
                    <StarRating count={getStarCount(c.visitCount)} visits={c.visitCount} />
                  </td>

                  {/* Última visita */}
                  <td className="px-5 py-4">
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>
                      {c.lastVisit ? formatDate(c.lastVisit) : <span style={{ color: "var(--foreground-muted)" }}>Nunca</span>}
                    </span>
                  </td>

                  {/* No-Shows */}
                  <td className="px-5 py-4">
                    {c.noShowCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={13} style={{ color: c.noShowCount >= 3 ? "#dc2626" : "#d97706" }} />
                        <span className="text-sm font-semibold" style={{ color: c.noShowCount >= 3 ? "#dc2626" : "#d97706" }}>{c.noShowCount}</span>
                        {c.noShowCount >= 3 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#fee2e2", color: "#dc2626" }}>
                            Alto
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>—</span>
                    )}
                  </td>

                  {/* Score */}
                  <td className="px-5 py-4">
                    <ScoreBadge customer={c} />
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-4">
                    <button
                      onClick={() => openProfile(c)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-70"
                      style={{ background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                    >
                      Ver perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SECTION 4 — Profile Side Panel */}
      {selectedCustomer && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setSelectedCustomer(null)}
          />

          <div
            className="fixed top-0 right-0 h-full z-50 flex flex-col"
            style={{
              width: "680px",
              background: "var(--surface)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* Panel Header */}
            <div
              className="px-6 py-5 border-b flex-shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                    style={{ background: selectedCustomer.isBlacklisted ? "#dc2626" : "var(--primary)" }}
                  >
                    {selectedCustomer.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>
                        {selectedCustomer.name}
                        {isBirthday(selectedCustomer.birthday) && " 🎂"}
                      </h3>
                      <ScoreBadge customer={selectedCustomer} />
                    </div>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {selectedCustomer.visitCount} visita{selectedCustomer.visitCount !== 1 ? "s" : ""}
                      {" · "}
                      {selectedCustomer.noShowCount} no-show{selectedCustomer.noShowCount !== 1 ? "s" : ""}
                      {selectedCustomer.createdAt && (
                        <> · Membro desde {new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(new Date(selectedCustomer.createdAt))}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                    style={{ background: "var(--primary)", color: "white" }}
                    onClick={() => {}}
                  >
                    + Nova Reserva
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                    style={{ color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: active ? "var(--primary)15" : "transparent",
                        color: active ? "var(--primary)" : "var(--foreground-muted)",
                        borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
                      }}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel Body */}
            {panelLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Carregando...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6" style={{ opacity: 1, transition: "opacity 0.15s" }}>
                {activeTab === "profile" && (
                  <ProfileTab
                    customer={selectedCustomer}
                    editAllergies={editAllergies} setEditAllergies={setEditAllergies}
                    editPreferences={editPreferences} setEditPreferences={setEditPreferences}
                    editFavoriteTable={editFavoriteTable} setEditFavoriteTable={setEditFavoriteTable}
                    editInternalNotes={editInternalNotes} setEditInternalNotes={setEditInternalNotes}
                    editBlacklisted={editBlacklisted} setEditBlacklisted={setEditBlacklisted}
                    editBlacklistReason={editBlacklistReason} setEditBlacklistReason={setEditBlacklistReason}
                    editTags={editTags} setEditTags={setEditTags}
                    saving={saving} onSave={saveProfile}
                  />
                )}
                {activeTab === "calendar" && (
                  <CalendarTab reservations={selectedCustomer.reservations ?? []} />
                )}
                {activeTab === "history" && (
                  <HistoryTab reservations={selectedCustomer.reservations ?? []} />
                )}
                {activeTab === "communications" && (
                  <CommunicationsTab logs={selectedCustomer.notificationLogs ?? []} />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
