"use client";

import { useState, useEffect } from "react";
import { CreditCard, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { PLANS, getPlanLimits } from "@/lib/plans";

const PLAN_BADGE: Record<string, { bg: string; color: string }> = {
  FREE:    { bg: "#6b728020", color: "#6b7280" },
  PRO:     { bg: "#2563eb20", color: "#2563eb" },
  PREMIUM: { bg: "#f0731620", color: "#f07316" },
};

function PlanBadge({ plan }: { plan: string }) {
  const style = PLAN_BADGE[plan] ?? PLAN_BADGE.FREE;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: style.bg, color: style.color }}
    >
      {PLANS[plan as keyof typeof PLANS]?.name ?? plan}
    </span>
  );
}

const planCards = [
  {
    key: "FREE",
    name: "Free",
    price: "R$ 0/mês",
    color: "#6b7280",
    features: ["50 reservas/mês", "1 usuário", "Sem WhatsApp"],
  },
  {
    key: "PRO",
    name: "Pro",
    price: "R$ 97/mês",
    color: "#2563eb",
    features: ["500 reservas/mês", "5 usuários", "WhatsApp incluído"],
  },
  {
    key: "PREMIUM",
    name: "Premium",
    price: "R$ 197/mês",
    color: "#f07316",
    features: ["Reservas ilimitadas", "Usuários ilimitados", "WhatsApp + Suporte prioritário"],
  },
];

export default function PlanosPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (role === "MASTER_SUPER") fetchRestaurants();
  }, [role]);

  async function fetchRestaurants() {
    setLoading(true);
    try {
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }

  async function handlePlanChange(restaurantId: string, plan: string) {
    setSaving(restaurantId);
    try {
      await fetch(`/api/restaurants/${restaurantId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      setRestaurants(prev =>
        prev.map(r => r.id === restaurantId ? { ...r, plan } : r)
      );
    } catch {
      /* noop */
    } finally {
      setSaving(null);
    }
  }

  if (role && role !== "MASTER_SUPER") {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <CreditCard size={40} className="mx-auto mb-4 opacity-20" style={{ color: "var(--foreground-muted)" }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>Acesso restrito</h2>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Apenas o Master pode gerenciar planos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--primary)" }}>
          Gestão Global
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Planos
        </h1>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {planCards.map(card => (
          <div
            key={card.key}
            className="rounded-xl border p-6 space-y-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold" style={{ color: card.color }}>{card.name}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{card.price}</span>
            </div>
            <ul className="space-y-2">
              {card.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground-muted)" }}>
                  <Check size={13} style={{ color: card.color, flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Restaurants table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-6 py-5 border-b flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>Planos dos Restaurantes</h2>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: "var(--primary)15", color: "var(--primary)" }}>
            {restaurants.length}
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
            <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="p-10 text-center">
            <CreditCard size={36} className="mx-auto mb-3 opacity-20" style={{ color: "var(--foreground-muted)" }} />
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Nenhum restaurante cadastrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Restaurante", "Plano Atual", "Reservas este mês", "Expira em", "Alterar Plano"].map(h => (
                  <th key={h} className="text-left text-xs font-medium px-6 py-4 uppercase tracking-wide"
                    style={{ color: "var(--foreground-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r, i) => {
                const limits = getPlanLimits(r.plan ?? "FREE");
                const limitLabel = limits.reservationsPerMonth === -1
                  ? "Ilimitado"
                  : `${r.reservationsThisMonth ?? 0} / ${limits.reservationsPerMonth}`;
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < restaurants.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                          style={{ background: "var(--primary)20", color: "var(--primary)" }}>
                          {r.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{r.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={r.plan ?? "FREE"} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{limitLabel}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                        {r.planExpiresAt
                          ? new Date(r.planExpiresAt).toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={r.plan ?? "FREE"}
                        disabled={saving === r.id}
                        onChange={e => handlePlanChange(r.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-sm outline-none disabled:opacity-50"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="FREE">Free</option>
                        <option value="PRO">Pro</option>
                        <option value="PREMIUM">Premium</option>
                      </select>
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
