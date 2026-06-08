"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao redefinir senha.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4 py-4">
        <XCircle size={32} className="mx-auto" style={{ color: "var(--danger)" }} />
        <p className="font-semibold" style={{ color: "var(--foreground)" }}>Link inválido</p>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Este link de redefinição é inválido ou já foi utilizado.
        </p>
        <Link href="/esqueci-senha"
          className="inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--primary)" }}>
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
          style={{ background: "var(--success)20" }}>
          <CheckCircle size={28} style={{ color: "var(--success)" }} />
        </div>
        <div>
          <p className="font-bold text-lg" style={{ color: "var(--foreground)" }}>Senha redefinida!</p>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Nova senha
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Escolha uma nova senha segura para sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wide"
            style={{ color: "var(--foreground-muted)" }}>Nova senha</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 pr-11 text-sm"
              style={{ background: "var(--surface-3)" }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60"
              style={{ color: "var(--foreground-dim)" }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wide"
            style={{ color: "var(--foreground-muted)" }}>Confirmar senha</label>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Repita a senha"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            className="w-full px-4 py-3 text-sm"
            style={{ background: "var(--surface-3)" }}
          />
        </div>

        {error && (
          <p className="text-sm px-3 py-2.5 rounded-xl"
            style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #fecaca" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--primary)", color: "#fff" }}>
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
            : "Salvar nova senha"}
        </button>
      </form>
    </>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#ffffff" }}>
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Reserva360" style={{ width: "100%", maxWidth: 280, objectFit: "contain" }} />
        </div>

        <div className="rounded-2xl border p-8 space-y-5 shadow-md"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Suspense fallback={<div className="py-8 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>Carregando...</div>}>
            <ResetForm />
          </Suspense>
        </div>

        <div className="flex justify-center mt-5">
          <Link href="/login"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--foreground-muted)" }}>
            <ArrowLeft size={14} /> Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
