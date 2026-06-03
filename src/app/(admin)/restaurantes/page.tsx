"use client";

import { useState, useEffect } from "react";
import { Store, Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RestaurantesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", slug: "", phone: "", email: "", address: "",
    adminName: "", adminEmail: "", adminPassword: "",
  });

  useEffect(() => {
    if (role === "MASTER_SUPER") fetchRestaurants();
  }, [role]);

  async function fetchRestaurants() {
    setLoading(true);
    try {
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar restaurante"); return; }
      setShowForm(false);
      setForm({ name: "", slug: "", phone: "", email: "", address: "", adminName: "", adminEmail: "", adminPassword: "" });
      fetchRestaurants();
    } catch {
      setError("Erro ao criar restaurante");
    } finally {
      setSaving(false);
    }
  }

  if (role && role !== "MASTER_SUPER") {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Store size={40} className="mx-auto mb-4 opacity-20" style={{ color: "var(--foreground-muted)" }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>Acesso restrito</h2>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Apenas o Master pode gerenciar restaurantes.</p>
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
            Gestão Global
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Restaurantes
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 shadow-sm"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          <Plus size={15} />
          Novo Restaurante
        </button>
      </div>

      {/* New Restaurant Form */}
      {showForm && (
        <div className="rounded-xl border p-6 space-y-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>Novo Restaurante</h2>
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
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                  placeholder="Nome do restaurante"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Slug *</label>
                <input
                  required
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="slug-do-restaurante"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Telefone</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="contato@restaurante.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Endereço</label>
                <input
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--foreground-muted)" }}>
                Admin do Restaurante
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Nome do Admin</label>
                  <input
                    value={form.adminName}
                    onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Email do Admin</label>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                    placeholder="admin@email.com"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>Senha</label>
                  <input
                    type="password"
                    value={form.adminPassword}
                    onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                    placeholder="Senha segura"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              </div>
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
                {saving ? "Salvando..." : "Criar Restaurante"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-6 py-5 border-b flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>Todos os Restaurantes</h2>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: "var(--primary)15", color: "var(--primary)" }}>
            {restaurants.length}
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
            <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="p-10 text-center">
            <Store size={36} className="mx-auto mb-3 opacity-20" style={{ color: "var(--foreground-muted)" }} />
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Nenhum restaurante cadastrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Nome", "Slug", "Status", "Usuários", "Criado em"].map(h => (
                  <th key={h} className="text-left text-xs font-medium px-6 py-4 uppercase tracking-wide"
                    style={{ color: "var(--foreground-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r, i) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors"
                  style={{ borderBottom: i < restaurants.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                        style={{ background: "var(--primary)20", color: "var(--primary)" }}>
                        {r.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono" style={{ color: "var(--foreground-muted)" }}>{r.slug}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={r.isActive
                        ? { background: "var(--success-bg)", color: "var(--success)" }
                        : { background: "var(--danger-bg)", color: "var(--danger)" }}>
                      {r.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{r._count?.users ?? 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                      {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
