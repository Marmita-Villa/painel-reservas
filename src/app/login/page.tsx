"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#ffffff" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Reserva360" style={{ width: "100%", maxWidth: 360, objectFit: "contain" }} />
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8 space-y-5 shadow-md"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "var(--foreground-muted)" }}>Email</label>
              <input type="email" placeholder="seu@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus
                className="w-full px-4 py-3 text-sm"
                style={{ background: "var(--surface-3)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "var(--foreground-muted)" }}>Senha</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required
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

            {error && (
              <p className="text-sm px-3 py-2.5 rounded-xl"
                style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #fecaca" }}>
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <a href="/esqueci-senha"
                className="text-xs transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}>
                Esqueci minha senha
              </a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--primary)", color: "#fff" }}>
              {loading
                ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                : <><LogIn size={16} /> Entrar no painel</>}
            </button>
          </form>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: "var(--foreground-dim)" }}>
          Reserva360 · Sistema de gestão de reservas
        </p>
      </div>
    </div>
  );
}
