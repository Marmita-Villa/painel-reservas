"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ContaNav from "@/components/conta/ContaNav";
import { Clock } from "lucide-react";

const C = {
  bg: "#f4f4f5",
  sur: "#ffffff",
  bdr: "#e4e4e7",
  fg: "#18181b",
  muted: "#71717a",
  gold: "#c9a84c",
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED: { label: "Concluída",  color: "#065f46", bg: "#d1fae5" },
  CANCELLED: { label: "Cancelada",  color: "#991b1b", bg: "#fee2e2" },
  NO_SHOW:   { label: "Não veio",   color: "#7f1d1d", bg: "#fef2f2" },
  CONFIRMED: { label: "Confirmada", color: "#065f46", bg: "#d1fae5" },
};

interface Reservation {
  id: string;
  date: string;
  partySize: number;
  status: string;
  occasion?: string;
}

function fmtDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function getYearMonth(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}
function fmtYearMonth(ym: string) {
  const [y, m] = ym.split("-");
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${months[parseInt(m) - 1]} ${y}`;
}

export default function HistoricoPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cliente/reservas?type=history");
        if (res.status === 401) { router.push(`/r/${slug}/conta/login`); return; }
        const data = await res.json();
        setReservations(data.reservations ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, router]);

  // Group by year-month
  const grouped: Record<string, Reservation[]> = {};
  for (const r of reservations) {
    const ym = getYearMonth(r.date);
    if (!grouped[ym]) grouped[ym] = [];
    grouped[ym].push(r);
  }
  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      <ContaNav slug={slug} />
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem 1rem" }}>
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: C.fg, marginBottom: "1.5rem" }}>Histórico de Reservas</h1>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: C.muted }}>Carregando...</div>
        ) : reservations.length === 0 ? (
          <div style={{ background: C.sur, borderRadius: "0.75rem", border: `1px solid ${C.bdr}`, padding: "3rem", textAlign: "center" }}>
            <Clock size={40} color={C.muted} style={{ margin: "0 auto 1rem" }} />
            <p style={{ color: C.muted }}>Nenhum histórico encontrado</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {sortedKeys.map(ym => (
              <div key={ym}>
                <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>{fmtYearMonth(ym)}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {grouped[ym].map(r => {
                    const st = STATUS_LABELS[r.status] ?? { label: r.status, color: C.muted, bg: "#f3f4f6" };
                    return (
                      <div key={r.id} style={{ background: C.sur, borderRadius: "0.75rem", border: `1px solid ${C.bdr}`, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: C.fg }}>{fmtTime(r.date)} — {fmtDate(r.date)}</div>
                          <div style={{ color: C.muted, fontSize: "0.8125rem", marginTop: "0.125rem" }}>{r.partySize} {r.partySize === 1 ? "pessoa" : "pessoas"}{r.occasion ? ` • ${r.occasion}` : ""}</div>
                        </div>
                        <span style={{ background: st.bg, color: st.color, padding: "0.25rem 0.625rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
