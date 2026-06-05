"use client";

import { useState } from "react";
import { Check, Zap, Crown, Loader2 } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";

const plans = [
  {
    key: "FREE",
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    color: "#6b7280",
    icon: null,
    features: [
      "50 reservas/mês",
      "1 usuário",
      "Widget público",
      "Dashboard básico",
    ],
    disabled: ["WhatsApp automático", "Relatórios avançados", "Suporte prioritário"],
  },
  {
    key: "PRO",
    name: "Pro",
    price: "R$ 97",
    period: "/mês",
    color: "#2563eb",
    icon: Zap,
    popular: true,
    features: [
      "500 reservas/mês",
      "5 usuários",
      "Widget público",
      "Dashboard completo",
      "WhatsApp automático",
      "Relatórios avançados",
      "Exportar CSV",
    ],
    disabled: ["Suporte prioritário", "White label"],
  },
  {
    key: "PREMIUM",
    name: "Premium",
    price: "R$ 197",
    period: "/mês",
    color: "#f07316",
    icon: Crown,
    features: [
      "Reservas ilimitadas",
      "Usuários ilimitados",
      "Widget público",
      "Dashboard completo",
      "WhatsApp automático",
      "Relatórios avançados",
      "Exportar CSV",
      "Suporte prioritário",
      "White label (em breve)",
    ],
    disabled: [],
  },
];

export default function UpgradePage() {
  const { restaurant } = useRestaurant();
  const currentPlan = (restaurant as any)?.plan ?? "FREE";
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planKey: string) {
    if (planKey === "FREE") return;
    setLoading(planKey);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Erro ao iniciar pagamento");
      }
    } catch {
      alert("Erro ao conectar com o servidor");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--primary)" }}>
          Planos & Preços
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Escolha o plano ideal
        </h1>
        <p className="text-base" style={{ color: "var(--foreground-muted)" }}>
          Comece grátis e faça upgrade quando precisar de mais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.key;
          const isPopular = (plan as any).popular;

          return (
            <div key={plan.key}
              className="rounded-2xl border overflow-hidden relative"
              style={{
                background: "var(--surface)",
                borderColor: isPopular ? plan.color : "var(--border)",
                boxShadow: isPopular ? `0 0 0 2px ${plan.color}` : undefined,
              }}>

              {isPopular && (
                <div className="absolute top-0 inset-x-0 text-center py-1 text-xs font-bold"
                  style={{ background: plan.color, color: "#fff" }}>
                  Mais popular
                </div>
              )}

              <div className={`p-6 space-y-5 ${isPopular ? "pt-9" : ""}`}>
                {/* Header */}
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${plan.color}20` }}>
                      <Icon size={16} style={{ color: plan.color }} />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-base" style={{ color: plan.color }}>{plan.name}</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>{plan.price}</span>
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{plan.period}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground-muted)" }}>
                      <Check size={13} style={{ color: "var(--success)", flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                  {plan.disabled.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm opacity-35" style={{ color: "var(--foreground-muted)" }}>
                      <span style={{ width: 13, flexShrink: 0 }}>—</span> {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="w-full py-3 rounded-xl text-sm font-semibold text-center"
                    style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
                    Plano atual
                  </div>
                ) : plan.key === "FREE" ? (
                  <div className="w-full py-3 rounded-xl text-sm text-center"
                    style={{ color: "var(--foreground-muted)" }}>
                    Plano gratuito
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={loading === plan.key}
                    className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: plan.color, color: "#fff" }}>
                    {loading === plan.key ? (
                      <><Loader2 size={15} className="animate-spin" /> Aguarde...</>
                    ) : (
                      `Assinar ${plan.name}`
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs" style={{ color: "var(--foreground-muted)" }}>
        Pagamento seguro via Stripe · Cancele a qualquer momento · Sem fidelidade
      </p>
    </div>
  );
}
