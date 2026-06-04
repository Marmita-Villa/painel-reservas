"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ContaNav from "@/components/conta/ContaNav";
import { Users, Calendar, PlusCircle, X } from "lucide-react";

const C = {
  bg: "#f4f4f5",
  sur: "#ffffff",
  bdr: "#e4e4e7",
  fg: "#18181b",
  muted: "#71717a",
  gold: "#f07316",
  goldL: "#fff7ed",
  error: "#dc2626",
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "Pendente",   color: "#92400e", bg: "#fef3c7" },
  CONFIRMED: { label: "Confirmada", color: "#065f46", bg: "#d1fae5" },
  ARRIVED:   { label: "Chegou",     color: "#1e40af", bg: "#dbeafe" },
  SEATED:    { label: "Sentado",    color: "#5b21b6", bg: "#ede9fe" },
  COMPLETED: { label: "Concluída",  color: "#374151", bg: "#f3f4f6" },
  CANCELLED: { label: "Cancelada",  color: "#991b1b", bg: "#fee2e2" },
  NO_SHOW:   { label: "Não veio",   color: "#7f1d1d", bg: "#fef2f2" },
};

interface Reservation {
  id: string;
  date: string;
  partySize: number;
  status: string;
  occasion?: string;
  notes?: string;
  table?: { name: string } | null;
  restaurant: { name: string };
}

interface ProfileData {
  name: string;
}

function fmtDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtTime(d: string) {
  const dt = new Date(d);
  return dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ReservasPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [resRes, profRes] = await Promise.all([
          fetch("/api/cliente/reservas?type=active"),
          fetch("/api/cliente/perfil"),
        ]);
        if (resRes.status === 401 || profRes.status === 401) {
          router.push(`/r/${slug}/conta/login`);
          return;
        }
        const resData = await resRes.json();
        const profData = await profRes.json();
        setReservations(resData.reservations ?? []);
        setProfile(profData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, router]);

  async function handleCancel(id: string) {
    setCancelling(id);
    try {
      const res = await fetch(`/api/cliente/reservas/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        setReservations(prev => prev.filter(r => r.id !== id));
      }
    } finally {
      setCancelling(null);
      setConfirmCancel(null);
    }
  }

  const now = new Date();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      <ContaNav slug={slug} />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem 1rem" }}>
        {profile && (
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: C.fg, marginBottom: "1.5rem" }}>
            Olá, {profile.name.split(" ")[0]}! 👋
          </h1>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: C.muted }}>Carregando reservas...</div>
        ) : reservations.length === 0 ? (
          <div style={{ background: C.sur, borderRadius: "0.75rem", border: `1px solid ${C.bdr}`, padding: "3rem", textAlign: "center" }}>
            <Calendar size={40} color={C.muted} style={{ margin: "0 auto 1rem" }} />
            <p style={{ color: C.fg, fontWeight: 600, marginBottom: "0.5rem" }}>Nenhuma reserva ativa</p>
            <p style={{ color: C.muted, fontSize: "0.875rem", marginBottom: "1.5rem" }}>Que tal fazer uma reserva agora?</p>
            <Link href={`/r/${slug}`} style={{ background: C.gold, color: "#fff", padding: "0.625rem 1.25rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: 600, fontSize: "0.9375rem" }}>
              Fazer reserva
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reservations.map(r => {
              const st = STATUS_LABELS[r.status] ?? { label: r.status, color: C.muted, bg: "#f3f4f6" };
              const isFuture = new Date(r.date) > now;
              const canCancel = isFuture && (r.status === "CONFIRMED" || r.status === "PENDING");
              return (
                <div key={r.id} style={{ background: C.sur, borderRadius: "0.75rem", border: `1px solid ${C.bdr}`, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: C.fg }}>{fmtTime(r.date)}</div>
                      <div style={{ color: C.muted, fontSize: "0.875rem", marginTop: "0.125rem", textTransform: "capitalize" }}>{fmtDate(r.date)}</div>
                    </div>
                    <span style={{ background: st.bg, color: st.color, padding: "0.25rem 0.625rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ marginTop: "0.875rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: C.muted, fontSize: "0.875rem" }}>
                      <Users size={14} />
                      {r.partySize} {r.partySize === 1 ? "pessoa" : "pessoas"}
                    </div>
                    {r.table && (
                      <div style={{ color: C.muted, fontSize: "0.875rem" }}>Mesa: {r.table.name}</div>
                    )}
                    {r.occasion && (
                      <div style={{ background: C.goldL, color: C.gold, padding: "0.125rem 0.5rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500 }}>{r.occasion}</div>
                    )}
                  </div>

                  {canCancel && (
                    <div style={{ marginTop: "0.875rem", borderTop: `1px solid ${C.bdr}`, paddingTop: "0.875rem" }}>
                      {confirmCancel === r.id ? (
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.875rem", color: C.fg }}>Cancelar esta reserva?</span>
                          <button onClick={() => handleCancel(r.id)} disabled={cancelling === r.id} style={{ background: C.error, color: "#fff", border: "none", borderRadius: "0.375rem", padding: "0.375rem 0.75rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                            {cancelling === r.id ? "Cancelando..." : "Confirmar"}
                          </button>
                          <button onClick={() => setConfirmCancel(null)} style={{ background: "none", border: `1px solid ${C.bdr}`, borderRadius: "0.375rem", padding: "0.375rem 0.75rem", fontSize: "0.875rem", cursor: "pointer", color: C.muted }}>
                            Voltar
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmCancel(r.id)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: `1px solid #fca5a5`, color: C.error, borderRadius: "0.375rem", padding: "0.375rem 0.75rem", fontSize: "0.875rem", cursor: "pointer" }}>
                          <X size={14} />
                          Cancelar reserva
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link href={`/r/${slug}`} style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", background: C.gold, color: "#fff", borderRadius: "999px", padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", fontWeight: 600, boxShadow: "0 4px 12px rgba(201,168,76,0.35)", fontSize: "0.9375rem" }}>
        <PlusCircle size={18} />
        Nova reserva
      </Link>
    </div>
  );
}
