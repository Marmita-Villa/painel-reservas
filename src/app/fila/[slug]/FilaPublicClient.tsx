"use client";

import { useState } from "react";
import { Users, Clock, CheckCircle2, ChevronRight } from "lucide-react";

// Same light theme tokens as widget
const C = {
  bg:    "#f4f4f5",
  sur:   "#ffffff",
  sur2:  "#fafafa",
  bdr:   "#e4e4e7",
  fg:    "#18181b",
  muted: "#71717a",
  gold:  "#c9a84c",
  goldL: "#fdf8ee",
  goldB: "#f0e8c8",
};

interface Props {
  restaurant: { id: string; name: string; slug: string };
  initialWaitingCount: number;
  initialEstimatedWait: number;
}

const partySizes = [1, 2, 3, 4, 5, 6, 7, 8];

export default function FilaPublicClient({ restaurant, initialWaitingCount, initialEstimatedWait }: Props) {
  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [partySize, setPartySize] = useState(2);
  const [notes,     setNotes]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState<{ position: number; estimatedWait: number } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { setError("Por favor, preencha nome e telefone."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          name: name.trim(),
          phone: phone.trim(),
          partySize,
          notes: notes.trim() || null,
          origin: "DIGITAL",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao entrar na fila");
      }
      // Re-fetch queue size for position estimate
      const listRes = await fetch(`/api/waitlist?restaurantId=${restaurant.id}`);
      const listData = listRes.ok ? await listRes.json() : [];
      const position = Array.isArray(listData) ? listData.filter((e: any) => e.status === "WAITING").length : initialWaitingCount + 1;
      const wait = position * 15;
      setSuccess({ position, estimatedWait: wait });
    } catch (err: any) {
      setError(err.message ?? "Erro ao entrar na fila. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-8 px-4" style={{ background: C.bg }}>
      <div className="w-full max-w-md">

        {/* Header card */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: C.sur, border: `1px solid ${C.bdr}` }}>
          <div style={{ background: `linear-gradient(135deg, ${C.gold}, #a07830)`, padding: "28px 24px 20px" }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={24} color="white" />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500, marginBottom: 2 }}>Fila de Espera</p>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "white", lineHeight: 1.2 }}>{restaurant.name}</h1>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 divide-x" style={{ borderTop: `1px solid ${C.bdr}` }}>
            <div style={{ padding: "16px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: C.fg }}>{initialWaitingCount}</p>
              <p style={{ fontSize: 12, color: C.muted }}>grupos na fila</p>
            </div>
            <div style={{ padding: "16px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: C.gold }}>~{initialEstimatedWait > 0 ? initialEstimatedWait : initialWaitingCount * 15}</p>
              <p style={{ fontSize: 12, color: C.muted }}>min de espera</p>
            </div>
          </div>
        </div>

        {/* Success screen */}
        {success ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: C.sur, border: `1px solid ${C.bdr}` }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.goldL, border: `2px solid ${C.goldB}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={36} color={C.gold} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.fg, marginBottom: 8 }}>Você entrou na fila!</h2>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
              Aguarde ser chamado pelo nome. Te avisaremos pelo WhatsApp!
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div style={{ background: C.goldL, border: `1px solid ${C.goldB}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: C.gold }}>{success.position}°</p>
                <p style={{ fontSize: 12, color: C.muted }}>posição</p>
              </div>
              <div style={{ background: C.goldL, border: `1px solid ${C.goldB}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: C.gold }}>~{success.estimatedWait}</p>
                <p style={{ fontSize: 12, color: C.muted }}>min de espera</p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: C.muted }}>Fique próximo ao restaurante. Você tem 10 minutos para se apresentar após ser chamado.</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="rounded-2xl overflow-hidden" style={{ background: C.sur, border: `1px solid ${C.bdr}` }}>
            <div style={{ padding: "24px 24px 0" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.fg, marginBottom: 4 }}>Entrar na Fila</h2>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Preencha seus dados para reservar seu lugar</p>

              {/* Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>SEU NOME</label>
                <input
                  required
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: "100%", borderRadius: 10, padding: "12px 14px", fontSize: 14, border: `1.5px solid ${C.bdr}`, background: C.sur2, color: C.fg, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = C.gold)}
                  onBlur={e => (e.target.style.borderColor = C.bdr)}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>WHATSAPP</label>
                <input
                  required
                  type="tel"
                  placeholder="(11) 99999-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: "100%", borderRadius: 10, padding: "12px 14px", fontSize: 14, border: `1.5px solid ${C.bdr}`, background: C.sur2, color: C.fg, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = C.gold)}
                  onBlur={e => (e.target.style.borderColor = C.bdr)}
                />
              </div>

              {/* Party size */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>QUANTAS PESSOAS?</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {partySizes.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPartySize(n)}
                      style={{
                        width: 44, height: 44, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
                        background: partySize === n ? C.gold : C.sur2,
                        color: partySize === n ? "white" : C.muted,
                        border: `1.5px solid ${partySize === n ? C.gold : C.bdr}`,
                        transition: "all 0.15s",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>OBSERVAÇÕES <span style={{ fontWeight: 400 }}>(opcional)</span></label>
                <textarea
                  placeholder="Ex: criança no carrinho, cadeirante..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  style={{ width: "100%", borderRadius: 10, padding: "12px 14px", fontSize: 13, border: `1.5px solid ${C.bdr}`, background: C.sur2, color: C.fg, outline: "none", resize: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = C.gold)}
                  onBlur={e => (e.target.style.borderColor = C.bdr)}
                />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: "#ef4444", background: "#ef444410", border: "1px solid #ef444430", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                  {error}
                </p>
              )}
            </div>

            {/* Submit */}
            <div style={{ padding: "0 24px 24px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  background: loading ? C.muted : C.gold,
                  color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Entrando na fila…
                  </>
                ) : (
                  <>
                    <Users size={18} />
                    Entrar na Fila
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 16 }}>
          Powered by Painel de Reservas
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
