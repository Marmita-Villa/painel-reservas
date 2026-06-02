"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, CalendarDays } from "lucide-react";

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

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

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
      style={{ background: "#09090b" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#c9a84c" }}>
            <CalendarDays size={24} style={{ color: "#09090b" }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#fafafa" }}>
            Reservas Pro
          </h1>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>
            Acesse o painel do seu restaurante
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border p-8 space-y-5"
          style={{ background: "#111113", borderColor: "#27272a" }}>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wide"
                style={{ color: "#52525b" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 text-sm"
                style={{ background: "#18181b", borderColor: "#27272a", borderRadius: "10px" }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wide"
                style={{ color: "#52525b" }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 text-sm"
                  style={{ background: "#18181b", borderColor: "#27272a", borderRadius: "10px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                  style={{ color: "#52525b" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm px-3 py-2.5 rounded-lg"
                style={{ background: "#450a0a", color: "#f87171", border: "1px solid #7f1d1d" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#c9a84c", color: "#09090b" }}>
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <><LogIn size={16} /> Entrar no painel</>
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: "#3f3f46" }}>
          Reservas Pro · Gestão de mesas e reservas
        </p>
      </div>
    </div>
  );
}
