"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import LogoComponent from "@/components/Logo";

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

function getStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: "", color: "#e4e4e7" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Fraca", color: "#dc2626" };
  if (score === 2) return { level: 2, label: "Regular", color: "#f59e0b" };
  if (score === 3) return { level: 3, label: "Boa", color: "#3b82f6" };
  return { level: 4, label: "Forte", color: "#22c55e" };
}

export default function CadastroPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cliente/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password, birthday: birthday || undefined, slug }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/r/${slug}/conta/reservas`);
      } else {
        setError(data.error ?? "Erro ao criar conta. Tente novamente.");
      }
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <img src="/logo.png" alt="Reserva360" style={{ maxHeight: 90, maxWidth: 280, objectFit: "contain", marginBottom: "0.75rem" }} />
          <p style={{ color: C.muted, fontSize: "0.875rem", margin: 0 }}>Gerencie suas reservas com facilidade</p>
        </div>

        <div style={{ background: C.sur, borderRadius: "0.75rem", border: `1px solid ${C.bdr}`, padding: "2rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: C.fg, marginBottom: "0.375rem" }}>Nome completo</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" style={{ width: "100%", padding: "0.625rem 0.75rem", border: `1px solid ${C.bdr}`, borderRadius: "0.5rem", fontSize: "0.9375rem", color: C.fg, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: C.fg, marginBottom: "0.375rem" }}>Telefone</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" style={{ width: "100%", padding: "0.625rem 0.75rem", border: `1px solid ${C.bdr}`, borderRadius: "0.5rem", fontSize: "0.9375rem", color: C.fg, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: C.fg, marginBottom: "0.375rem" }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={{ width: "100%", padding: "0.625rem 0.75rem", border: `1px solid ${C.bdr}`, borderRadius: "0.5rem", fontSize: "0.9375rem", color: C.fg, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: C.fg, marginBottom: "0.375rem" }}>Senha</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "0.625rem 2.5rem 0.625rem 0.75rem", border: `1px solid ${C.bdr}`, borderRadius: "0.5rem", fontSize: "0.9375rem", color: C.fg, outline: "none", boxSizing: "border-box" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0, display: "flex" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: "0.375rem" }}>
                  <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.25rem" }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength.level ? strength.color : "#e4e4e7", transition: "background 0.2s" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: C.fg, marginBottom: "0.375rem" }}>Confirmar senha</label>
              <div style={{ position: "relative" }}>
                <input type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "0.625rem 2.5rem 0.625rem 0.75rem", border: `1px solid ${C.bdr}`, borderRadius: "0.5rem", fontSize: "0.9375rem", color: C.fg, outline: "none", boxSizing: "border-box" }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0, display: "flex" }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: C.fg, marginBottom: "0.375rem" }}>Data de aniversário <span style={{ color: C.muted, fontWeight: 400 }}>(opcional)</span></label>
              <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} style={{ width: "100%", padding: "0.625rem 0.75rem", border: `1px solid ${C.bdr}`, borderRadius: "0.5rem", fontSize: "0.9375rem", color: C.fg, outline: "none", boxSizing: "border-box" }} />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.625rem 0.75rem", color: C.error, fontSize: "0.875rem" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ background: C.gold, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "1rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "0.25rem" }}>
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: C.muted }}>
          Já tem conta?{" "}
          <Link href={`/r/${slug}/conta/login`} style={{ color: C.gold, fontWeight: 600, textDecoration: "none" }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
