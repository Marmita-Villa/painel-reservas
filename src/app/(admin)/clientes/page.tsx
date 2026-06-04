"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, Star, AlertTriangle, X, Ban, Utensils, Heart, MapPin, FileText, Bell } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";

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
  reservations?: Array<{
    id: string;
    date: string;
    status: string;
    partySize: number;
    table?: { name?: string } | null;
  }>;
  notificationLogs?: Array<{
    id: string;
    type: string;
    phone: string;
    success: boolean;
    sentAt: string;
  }>;
}

const statusLabel: Record<string, string> = {
  CONFIRMED: "Confirmado", ARRIVED: "Chegou", SEATED: "Sentado",
  PENDING: "Pendente", NO_SHOW: "No-Show", CANCELLED: "Cancelado", COMPLETED: "Concluído",
};

const notifTypeLabel: Record<string, string> = {
  CONFIRMATION: "Confirmação", REMINDER_24H: "Lembrete 24h", REMINDER_2H: "Lembrete 2h",
  CANCELLATION: "Cancelamento", POST_VISIT: "Pós-visita",
};

function isBirthday(birthday: string | null | undefined): boolean {
  if (!birthday) return false;
  const today = new Date();
  const bday = new Date(birthday);
  return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
}

export default function ClientesPage() {
  const { effectiveRestaurantId } = useRestaurant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile panel edit state
  const [editAllergies, setEditAllergies] = useState("");
  const [editPreferences, setEditPreferences] = useState("");
  const [editFavoriteTable, setEditFavoriteTable] = useState("");
  const [editInternalNotes, setEditInternalNotes] = useState("");
  const [editBlacklisted, setEditBlacklisted] = useState(false);
  const [editBlacklistReason, setEditBlacklistReason] = useState("");

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
    setEditAllergies(c.allergies ?? "");
    setEditPreferences(c.preferences ?? "");
    setEditFavoriteTable(c.favoriteTable ?? "");
    setEditInternalNotes(c.internalNotes ?? "");
    setEditBlacklisted(c.isBlacklisted);
    setEditBlacklistReason(c.blacklistReason ?? "");
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

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Clientes
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            CRM integrado — histórico e perfil de cada cliente
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>Carregando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--foreground-muted)" }} />
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Nenhum cliente encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Cliente", "Contato", "Visitas", "No-Shows", "Tags", "Ações"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium px-5 py-3" style={{ color: "var(--foreground-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : undefined }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                        style={{ background: c.isBlacklisted ? "var(--danger)" : "var(--primary)" }}
                      >
                        {c.name[0]}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{c.name}</span>
                        {isBirthday(c.birthday) && <span title="Aniversário hoje!">🎂</span>}
                        {c.isBlacklisted && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"
                            style={{ background: "var(--danger)20", color: "var(--danger)" }}
                          >
                            <Ban size={10} /> Blacklist
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm" style={{ color: "var(--foreground)" }}>{c.phone ?? "—"}</p>
                      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{c.email ?? ""}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Star size={13} style={{ color: "var(--warning)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{c.visitCount}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {c.noShowCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={13} style={{ color: "var(--danger)" }} />
                        <span className="text-sm font-medium" style={{ color: "var(--danger)" }}>{c.noShowCount}</span>
                        {c.noShowCount >= 3 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "var(--warning)20", color: "var(--warning)" }}
                          >
                            Risco
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: tag === "VIP" ? "var(--warning)20" : "var(--surface-2)",
                            color: tag === "VIP" ? "var(--warning)" : "var(--foreground-muted)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => openProfile(c)}
                      className="text-xs px-3 py-1 rounded-lg transition-opacity hover:opacity-70"
                      style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
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

      {/* Profile Side Panel */}
      {selectedCustomer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setSelectedCustomer(null)}
          />

          {/* Panel */}
          <div
            className="fixed top-0 right-0 h-full z-50 overflow-y-auto flex flex-col"
            style={{
              width: "480px",
              background: "var(--surface)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold text-white"
                  style={{ background: selectedCustomer.isBlacklisted ? "var(--danger)" : "var(--primary)" }}
                >
                  {selectedCustomer.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
                      {selectedCustomer.name}
                    </h3>
                    {isBirthday(selectedCustomer.birthday) && <span>🎂</span>}
                  </div>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {selectedCustomer.visitCount} visita{selectedCustomer.visitCount !== 1 ? "s" : ""} · {selectedCustomer.noShowCount} no-show{selectedCustomer.noShowCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "var(--foreground-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            {panelLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Carregando...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.isBlacklisted && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                      style={{ background: "var(--danger)20", color: "var(--danger)" }}
                    >
                      <Ban size={11} /> Na lista negra
                    </span>
                  )}
                  {selectedCustomer.noShowCount >= 3 && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "var(--warning)20", color: "var(--warning)" }}
                    >
                      ⚠ Risco de no-show
                    </span>
                  )}
                </div>

                {/* Profile fields */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Perfil do Cliente</h4>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      <Utensils size={12} /> Alergias / Restrições alimentares
                    </label>
                    <textarea
                      value={editAllergies}
                      onChange={(e) => setEditAllergies(e.target.value)}
                      placeholder="Ex: Intolerante a lactose, sem glúten..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      <Heart size={12} /> Preferências
                    </label>
                    <textarea
                      value={editPreferences}
                      onChange={(e) => setEditPreferences(e.target.value)}
                      placeholder="Ex: Prefere mesa ao fundo, vinho tinto..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      <MapPin size={12} /> Mesa favorita
                    </label>
                    <input
                      type="text"
                      value={editFavoriteTable}
                      onChange={(e) => setEditFavoriteTable(e.target.value)}
                      placeholder="Ex: Mesa 7, Varanda"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      <FileText size={12} /> Notas internas
                    </label>
                    <textarea
                      value={editInternalNotes}
                      onChange={(e) => setEditInternalNotes(e.target.value)}
                      placeholder="Informações internas sobre o cliente..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>

                  {/* Blacklist toggle */}
                  <div
                    className="flex items-start justify-between p-3 rounded-lg border"
                    style={{ borderColor: editBlacklisted ? "var(--danger)50" : "var(--border)", background: editBlacklisted ? "var(--danger)08" : "var(--surface-2)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: editBlacklisted ? "var(--danger)" : "var(--foreground)" }}>
                        Lista negra
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                        Bloquear reservas futuras deste cliente
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editBlacklisted}
                      onChange={(e) => setEditBlacklisted(e.target.checked)}
                      className="accent-red-500 mt-1"
                    />
                  </div>

                  {editBlacklisted && (
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                        Motivo da lista negra
                      </label>
                      <input
                        type="text"
                        value={editBlacklistReason}
                        onChange={(e) => setEditBlacklistReason(e.target.value)}
                        placeholder="Ex: Múltiplos no-shows, comportamento inadequado..."
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                  )}

                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                    style={{ background: "var(--primary)" }}
                  >
                    {saving ? "Salvando..." : "Salvar perfil"}
                  </button>
                </div>

                {/* Visit history */}
                {selectedCustomer.reservations && selectedCustomer.reservations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                      Histórico de Visitas
                    </h4>
                    <div className="space-y-2">
                      {selectedCustomer.reservations.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                        >
                          <div>
                            <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                              {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(r.date))}
                              {" "}às{" "}
                              {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(r.date))}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                              {r.partySize} pessoa{r.partySize !== 1 ? "s" : ""}{r.table?.name ? ` · ${r.table.name}` : ""}
                            </p>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: r.status === "COMPLETED" || r.status === "ARRIVED" ? "var(--success)20" : r.status === "NO_SHOW" || r.status === "CANCELLED" ? "var(--danger)20" : "var(--surface-3)",
                              color: r.status === "COMPLETED" || r.status === "ARRIVED" ? "var(--success)" : r.status === "NO_SHOW" || r.status === "CANCELLED" ? "var(--danger)" : "var(--foreground-muted)",
                            }}
                          >
                            {statusLabel[r.status] ?? r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notification logs */}
                {selectedCustomer.notificationLogs && selectedCustomer.notificationLogs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
                      <Bell size={13} /> Histórico de Comunicações
                    </h4>
                    <div className="space-y-2">
                      {selectedCustomer.notificationLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                        >
                          <div>
                            <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                              {notifTypeLabel[log.type] ?? log.type}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                              {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(log.sentAt))}
                            </p>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: log.success ? "var(--success)20" : "var(--danger)20",
                              color: log.success ? "var(--success)" : "var(--danger)",
                            }}
                          >
                            {log.success ? "Enviado" : "Falhou"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
