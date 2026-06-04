"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import LogoComponent from "@/components/Logo";

const C = {
  bg: "#ffffff",
  sur: "#ffffff",
  bdr: "#e4e4e7",
  fg: "#18181b",
  muted: "#71717a",
  gold: "#f07316",
  goldL: "#fff7ed",
  error: "#dc2626",
};

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/cliente/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, slug }),
      });
      if (res.ok) {
        router.push(`/r/${slug}/conta/reservas`);
      } else {
        setError("Email ou senha inválidos");
      }
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <img src="/logo.png" alt="Reserva360" style={{ maxHeight: 90, maxWidth: 280, objectFit: "contain", marginBottom: "0.75rem" }} />
          <p style={{ color: C.muted, fontSize: "0.875rem", margin: 0 }}>Faça login para gerenciar suas reservas</p>
        </div>

        {/* Card */}
        <div style={{ background: C.sur, borderRadius: "0.75rem", border: `1px solid ${C.bdr}`, padding: "2rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: C.fg, marginBottom: "0.375rem" }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{ width: "100%", padding: "0.625rem 0.75rem", border: `1px solid ${C.bdr}`, borderRadius: "0.5rem", fontSize: "0.9375rem", color: C.fg, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: C.fg, marginBottom: "0.375rem" }}>Senha</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "0.625rem 2.5rem 0.625rem 0.75rem", border: `1px solid ${C.bdr}`, borderRadius: "0.5rem", fontSize: "0.9375rem", color: C.fg, outline: "none", boxSizing: "border-box" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0, display: "flex" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.625rem 0.75rem", color: C.error, fontSize: "0.875rem" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: C.gold, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "1rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "0.25rem" }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <Link href={`/r/${slug}/conta/login`} style={{ color: C.muted, fontSize: "0.8125rem", textDecoration: "none" }}>
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: C.muted }}>
          Não tem conta?{" "}
          <Link href={`/r/${slug}/conta/cadastro`} style={{ color: C.gold, fontWeight: 600, textDecoration: "none" }}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
