"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Users, Phone, Bell, Link2, Check, X } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";

const statusStyle: Record<string, { label: string; bg: string; color: string }> = {
  WAITING:   { label: "Aguardando", bg: "var(--warning)20",  color: "var(--warning)" },
  CALLED:    { label: "Chamado",    bg: "var(--info)20",     color: "var(--info)" },
  SEATED:    { label: "Sentado",    bg: "var(--success)20",  color: "var(--success)" },
  CANCELLED: { label: "Cancelado",  bg: "var(--danger)20",   color: "var(--danger)" },
};

export default function FilaPage() {
  const { effectiveRestaurantId, restaurants } = useRestaurant();
  const [waitlist, setWaitlist]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [showAdd, setShowAdd]     = useState(false);

  // Add form state
  const [addName, setAddName]     = useState("");
  const [addPhone, setAddPhone]   = useState("");
  const [addParty, setAddParty]   = useState(2);
  const [addNotes, setAddNotes]   = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [slug, setSlug] = useState("");
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/fila/${slug}`
    : `/fila/${slug}`;

  // Fetch slug from restaurants list or a dedicated endpoint
  useEffect(() => {
    if (!effectiveRestaurantId) return;
    // Try to find slug from context restaurants list first
    const found = restaurants.find((r: any) => r.id === effectiveRestaurantId);
    if (found?.slug) { setSlug(found.slug); return; }
    // Fallback: fetch restaurant info
    fetch(`/api/restaurants/${effectiveRestaurantId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.slug) setSlug(data.slug); })
      .catch(() => {});
  }, [effectiveRestaurantId, restaurants]);

  const fetchWaitlist = useCallback(async () => {
    if (!effectiveRestaurantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/waitlist?restaurantId=${effectiveRestaurantId}`);
      const data = await res.json();
      setWaitlist(Array.isArray(data) ? data : []);
    } catch { setWaitlist([]); }
    finally { setLoading(false); }
  }, [effectiveRestaurantId]);

  useEffect(() => { fetchWaitlist(); }, [fetchWaitlist]);

  const active = waitlist.filter(e => ["WAITING","CALLED"].includes(e.status));
  const avgWait = active.length > 0 ? Math.round(active.reduce((s, e) => s + (e.estimatedWait ?? 20), 0) / active.length) : 0;

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchWaitlist();
    } catch (e) { console.error(e); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveRestaurantId || !addName || !addPhone) return;
    setAddLoading(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: effectiveRestaurantId, name: addName, phone: addPhone, partySize: addParty, notes: addNotes }),
      });
      setAddName(""); setAddPhone(""); setAddParty(2); setAddNotes("");
      setShowAdd(false);
      fetchWaitlist();
    } catch { } finally { setAddLoading(false); }
  }

  function copyUrl() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Fila de Espera</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            {active.length} pessoa{active.length !== 1 ? "s" : ""} aguardando
            {avgWait > 0 && ` · Espera média: ~${avgWait} min`}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} />
          Adicionar à Fila
        </button>
      </div>

      {/* Compartilhar Fila Digital */}
      {slug && (
        <div className="flex items-center gap-4 p-4 rounded-xl border flex-wrap"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2" style={{ color: "var(--foreground-muted)" }}>
            <Link2 size={18} />
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Fila Digital pelo Celular</span>
          </div>
          <code className="flex-1 text-xs px-3 py-2 rounded-lg truncate"
            style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
            {publicUrl}
          </code>
          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: copied ? "var(--success)20" : "var(--primary)20", color: copied ? "var(--success)" : "var(--primary)" }}
          >
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            {copied ? "Copiado!" : "Copiar link"}
          </button>
          <a
            href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
          >
            QR Code
          </a>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl border space-y-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Adicionar à Fila</h3>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Nome" value={addName} onChange={e => setAddName(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            <input required placeholder="Telefone" value={addPhone} onChange={e => setAddPhone(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs" style={{ color: "var(--foreground-muted)" }}>Pessoas:</label>
            {[1,2,3,4,5,6,7,8].map(n => (
              <button key={n} type="button" onClick={() => setAddParty(n)}
                className="w-8 h-8 rounded-lg text-xs font-semibold"
                style={{ background: addParty === n ? "var(--primary)" : "var(--surface-2)", color: addParty === n ? "white" : "var(--foreground-muted)", border: "1px solid var(--border)" }}>
                {n}
              </button>
            ))}
          </div>
          <input placeholder="Observações (opcional)" value={addNotes} onChange={e => setAddNotes(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          <div className="flex gap-2">
            <button type="submit" disabled={addLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "var(--primary)", opacity: addLoading ? 0.6 : 1 }}>
              {addLoading ? "Adicionando…" : "Adicionar"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
          <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Carregando fila…</p>
        </div>
      ) : active.length === 0 ? (
        <div className="p-10 text-center rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground-muted)" }}>
          <Clock size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Fila vazia no momento</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {active.map((entry, i) => {
            const s = statusStyle[entry.status] ?? statusStyle.WAITING;
            return (
              <div key={entry.id} className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{entry.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Phone size={12} style={{ color: "var(--foreground-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{entry.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} style={{ color: "var(--foreground-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{entry.partySize} pessoa{entry.partySize > 1 ? "s" : ""}</span>
                    </div>
                    {entry.estimatedWait && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} style={{ color: "var(--foreground-muted)" }} />
                        <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>~{entry.estimatedWait} min</span>
                      </div>
                    )}
                  </div>
                  {entry.notes && <p className="text-xs mt-1 italic" style={{ color: "var(--foreground-muted)" }}>{entry.notes}</p>}
                </div>

                <div className="flex items-center gap-2">
                  {entry.status === "WAITING" && (
                    <button onClick={() => updateStatus(entry.id, "CALLED")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: "var(--info)20", color: "var(--info)" }}>
                      <Bell size={12} />
                      Chamar
                    </button>
                  )}
                  {["WAITING","CALLED"].includes(entry.status) && (
                    <button onClick={() => updateStatus(entry.id, "SEATED")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: "var(--success)20", color: "var(--success)" }}>
                      <Users size={12} />
                      Sentar
                    </button>
                  )}
                  <button onClick={() => updateStatus(entry.id, "CANCELLED")}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: "var(--danger)20", color: "var(--danger)" }}>
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
