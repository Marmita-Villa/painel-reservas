"use client";

import { useState, useEffect } from "react";
import { UserCog, Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";

const roleBadge: Record<string, { label: string; bg: string; color: string }> = {
  MASTER_SUPER: { label: "Master",  bg: "#7c3aed20", color: "#7c3aed" },
  ADMIN:        { label: "Admin",   bg: "#2563eb20", color: "#2563eb" },
  GERENTE:      { label: "Gerente", bg: "#16a34a20", color: "#16a34a" },
  USUARIO:      { label: "Usuário", bg: "#71717a20", color: "#71717a" },
};

const roleOptions = [
  { value: "ADMIN",   label: "Admin" },
  { value: "GERENTE", label: "Gerente" },
  { value: "USUARIO", label: "Usuário" },
];

export default function UsuariosPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [users, setUsers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "GERENTE", restaurantId: "",
  });

  useEffect(() => {
    if (role === "ADMIN" || role === "MASTER_SUPER") {
      fetchUsers();
      if (role === "MASTER_SUPER") fetchRestaurants();
    }
  }, [role]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }

  async function fetchRestaurants() {
    try {
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch {
      /* noop */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar usuário"); return; }
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "GERENTE", restaurantId: "" });
      fetchUsers();
    } catch {
      setError("Erro ao criar usuário");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(userId: string, current: boolean) {
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchUsers();
  }

  if (role && role !== "ADMIN" && role !== "MASTER_SUPER") {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <UserCog size={40} className="mx-auto mb-4 opacity-20" style={{ color: "var(--foreground-muted)" }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>Acesso restrito</h2>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Você não tem permissão para gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--primary)" }}>
            Controle de Acesso
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Usuários
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 shadow-sm"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          <Plus size={15} />
          Novo Usuário
        </button>
      </div>

      {/* New User Form */}
      {showForm && (
        <div className="rounded-xl border p-6 space-y-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>Novo Usuário</h2>
            <button onClick={() => setShowForm(false)} className="opacity-40 hover:opacity-70 transition-opacity">
              <X size={18} style={{ color: "var(--foreground)" }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Nome *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Senha *</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Senha segura"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Perfil *</label>
                <select
                  required
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  {roleOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {role === "MASTER_SUPER" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Restaurante</label>
                  <select
                    value={form.restaurantId}
                    onChange={e => setForm(f => ({ ...f, restaurantId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >
                    <option value="">Sem restaurante</option>
                    {restaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm border transition-opacity hover:opacity-70"
                style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--primary)", color: "#fff" }}>
                {saving ? "Salvando..." : "Criar Usuário"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-6 py-5 border-b flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>Usuários</h2>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: "var(--primary)15", color: "var(--primary)" }}>
            {users.length}
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
            <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <UserCog size={36} className="mx-auto mb-3 opacity-20" style={{ color: "var(--foreground-muted)" }} />
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[
                  "Nome",
                  "Email",
                  "Perfil",
                  ...(role === "MASTER_SUPER" ? ["Restaurante"] : []),
                  "Status",
                  "Ações",
                ].map(h => (
                  <th key={h} className="text-left text-xs font-medium px-6 py-4 uppercase tracking-wide"
                    style={{ color: "var(--foreground-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const badge = roleBadge[u.role] ?? roleBadge.USUARIO;
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < users.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ background: badge.bg, color: badge.color }}>
                          {u.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    {role === "MASTER_SUPER" && (
                      <td className="px-6 py-4">
                        <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                          {u.restaurant?.name ?? "—"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={u.isActive
                          ? { background: "var(--success-bg)", color: "var(--success)" }
                          : { background: "var(--danger-bg)", color: "var(--danger)" }}>
                        {u.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(u.id, u.isActive)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                        style={u.isActive
                          ? { background: "var(--danger-bg)", color: "var(--danger)" }
                          : { background: "var(--success-bg)", color: "var(--success)" }}>
                        {u.isActive ? "Desativar" : "Ativar"}
                      </button>
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
