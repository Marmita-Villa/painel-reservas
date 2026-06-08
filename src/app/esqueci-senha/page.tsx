"use client";

import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Erro ao enviar email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#ffffff" }}>
      <div className="w-full max-w-sm">

        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Reserva360" style={{ width: "100%", maxWidth: 280, objectFit: "contain" }} />
        </div>

        <div className="rounded-2xl border p-8 space-y-5 shadow-md"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "var(--success)20" }}>
                <CheckCircle size={28} style={{ color: "var(--success)" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                  Email enviado!
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                  Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
                </p>
              </div>
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                Verifique também a pasta de spam.
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                  Esqueceu a senha?
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                  Informe seu email e enviaremos um link para criar uma nova senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                    style={{ color: "var(--foreground-muted)" }}>Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--foreground-dim)" }} />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 text-sm"
                      style={{ background: "var(--surface-3)" }}
                    />
                  </div>
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
                    ? <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                    : "Enviar link de redefinição"}
                </button>
              </form>
            </>
          )}
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
