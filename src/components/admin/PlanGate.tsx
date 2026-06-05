"use client";

import { useState } from "react";
import { Lock, Zap, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRestaurant } from "@/contexts/RestaurantContext";

interface PlanGateProps {
  requiredPlan: "PRO" | "PREMIUM";
  children: React.ReactNode;
  feature?: string;
}

const PLAN_ORDER = { FREE: 0, PRO: 1, PREMIUM: 2 };

function UpgradeModal({ feature, requiredPlan, onClose }: { feature: string; requiredPlan: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-6 pt-6 pb-5 border-b flex items-start justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f07316/15", backgroundColor: "rgba(240,115,22,0.15)" }}>
              <Zap size={18} style={{ color: "#f07316" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Funcionalidade {requiredPlan}</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{feature}</p>
            </div>
          </div>
          <button onClick={onClose} className="opacity-40 hover:opacity-70 transition-opacity">
            <X size={18} style={{ color: "var(--foreground)" }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            Esta funcionalidade requer o plano <strong style={{ color: "var(--foreground)" }}>{requiredPlan}</strong> ou superior.
            Faça upgrade para desbloquear.
          </p>

          <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            {requiredPlan === "PRO" && (
              <>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Plano Pro — R$ 97/mês</p>
                {["500 reservas/mês", "5 usuários", "WhatsApp automático", "Relatórios avançados"].map(f => (
                  <p key={f} className="text-xs flex items-center gap-2" style={{ color: "var(--foreground-muted)" }}>
                    <span style={{ color: "var(--success)" }}>✓</span> {f}
                  </p>
                ))}
              </>
            )}
            {requiredPlan === "PREMIUM" && (
              <>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Plano Premium — R$ 197/mês</p>
                {["Reservas ilimitadas", "Usuários ilimitados", "WhatsApp prioritário", "Suporte dedicado", "White label"].map(f => (
                  <p key={f} className="text-xs flex items-center gap-2" style={{ color: "var(--foreground-muted)" }}>
                    <span style={{ color: "var(--success)" }}>✓</span> {f}
                  </p>
                ))}
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm border transition-opacity hover:opacity-70"
              style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}>
              Agora não
            </button>
            <a href="/upgrade" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-90"
              style={{ background: "#f07316", color: "#fff" }}>
              Ver planos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanGate({ requiredPlan, children, feature = "Esta funcionalidade" }: PlanGateProps) {
  const { data: session } = useSession();
  const { restaurant } = useRestaurant();
  const [showModal, setShowModal] = useState(false);

  const currentPlan = (restaurant as any)?.plan ?? (session?.user as any)?.plan ?? "FREE";
  const currentLevel = PLAN_ORDER[currentPlan as keyof typeof PLAN_ORDER] ?? 0;
  const requiredLevel = PLAN_ORDER[requiredPlan];

  if (currentLevel >= requiredLevel) return <>{children}</>;

  return (
    <>
      {showModal && (
        <UpgradeModal feature={feature} requiredPlan={requiredPlan} onClose={() => setShowModal(false)} />
      )}
      <div className="relative cursor-pointer" onClick={() => setShowModal(true)}>
        <div className="pointer-events-none opacity-40 select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ background: "rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
            <Lock size={11} /> {requiredPlan}
          </div>
        </div>
      </div>
    </>
  );
}
