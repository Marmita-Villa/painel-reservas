"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); window.location.href = "/dashboard"; return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md text-center space-y-6 rounded-2xl border p-10"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4"
          style={{ background: "rgba(34,197,94,0.1)", borderColor: "#86efac" }}>
          <CheckCircle2 size={40} style={{ color: "#16a34a" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Pagamento confirmado!
          </h1>
          <p className="text-base" style={{ color: "var(--foreground-muted)" }}>
            Seu plano foi atualizado com sucesso. Aproveite todos os recursos!
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: "rgba(34,197,94,0.08)" }}>
          <Zap size={16} style={{ color: "#16a34a" }} />
          <span className="text-sm font-medium" style={{ color: "#16a34a" }}>
            Plano ativado com sucesso
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Redirecionando para o dashboard em <strong>{countdown}s</strong>…
        </p>
        <a href="/dashboard" className="block w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "var(--primary)", color: "#fff" }}>
          Ir para o Dashboard agora
        </a>
      </div>
    </div>
  );
}

export default function UpgradeSucessoPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
