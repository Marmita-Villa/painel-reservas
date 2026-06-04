"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ContaNav from "@/components/conta/ContaNav";
import { Eye, EyeOff, Save, Check } from "lucide-react";

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

interface Profile {
  name: string;
  phone: string;
  email: string;
  birthday: string;
  allergies: string;
  preferences: string;
}

export default function PerfilPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [profile, setProfile] = useState<Profile>({ name: "", phone: "", email: "", birthday: "", allergies: "", preferences: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cliente/perfil");
        if (res.status === 401) { router.push(`/r/${slug}/conta/login`); return; }
        const data = await res.json();
        setProfile({
          name: data.name ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          birthday: data.birthday ? data.birthday.split("T")[0] : "",
          allergies: data.allergies ?? "",
          preferences: data.preferences ?? "",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/cliente/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, birthday: profile.birthday || undefined, allergies: profile.allergies, preferences: profile.preferences }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError("Erro ao salvar. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) { setPwError("As senhas não coincidem"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/cliente/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwSaved(true);
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        setTimeout(() => setPwSaved(false), 2500);
      } else {
        setPwError(data.error ?? "Erro ao alterar senha.");
      }
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { width: "100%", padding: "0.625rem 0.75rem", border: `1px solid ${C.bdr}`, borderRadius: "0.5rem", fontSize: "0.9375rem", color: C.fg, outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { display: "block" as const, fontSize: "0.875rem", fontWeight: 500 as const, color: C.fg, marginBottom: "0.375rem" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      <ContaNav slug={slug} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem 1rem" }}>
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: C.fg, marginBottom: "1.5rem" }}>Meu Perfil</h1>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: C.muted }}>Carregando...</div>
        ) : (
          <>
            {/* Profile form */}
            <div style={{ background: C.sur, borderRadius: "0.75rem", border: `1px solid ${C.bdr}`, padding: "1.5rem", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, color: C.fg, marginBottom: "1.25rem", marginTop: 0 }}>Dados pessoais</h2>
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Nome completo</label>
                  <input type="text" required value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Telefone</label>
                  <input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email <span style={{ color: C.muted, fontWeight: 400 }}>(não editável)</span></label>
                  <input type="email" value={profile.email} readOnly style={{ ...inputStyle, background: "#f9f9f9", color: C.muted, cursor: "not-allowed" }} />
                </div>
                <div>
                  <label style={labelStyle}>Data de aniversário</label>
                  <input type="date" value={profile.birthday} onChange={e => setProfile({ ...profile, birthday: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Alergias / restrições alimentares</label>
                  <textarea value={profile.allergies} onChange={e => setProfile({ ...profile, allergies: e.target.value })} rows={2} placeholder="Ex: amendoim, lactose..." style={{ ...inputStyle, resize: "vertical" as const }} />
                </div>
                <div>
                  <label style={labelStyle}>Preferências</label>
                  <textarea value={profile.preferences} onChange={e => setProfile({ ...profile, preferences: e.target.value })} rows={2} placeholder="Ex: mesa perto da janela, cadeirinha para bebê..." style={{ ...inputStyle, resize: "vertical" as const }} />
                </div>

                {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.625rem 0.75rem", color: C.error, fontSize: "0.875rem" }}>{error}</div>}

                <button type="submit" disabled={saving} style={{ background: C.gold, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "1rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  {saved ? <><Check size={16} /> Salvo!</> : <><Save size={16} /> {saving ? "Salvando..." : "Salvar alterações"}</>}
                </button>
              </form>
            </div>

            {/* Password change */}
            <div style={{ background: C.sur, borderRadius: "0.75rem", border: `1px solid ${C.bdr}`, padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, color: C.fg, marginBottom: "1.25rem", marginTop: 0 }}>Alterar senha</h2>
              <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Senha atual</label>
                  <div style={{ position: "relative" }}>
                    <input type={showCurrent ? "text" : "password"} required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ ...inputStyle, paddingRight: "2.5rem" }} />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0 }}>
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Nova senha</label>
                  <div style={{ position: "relative" }}>
                    <input type={showNew ? "text" : "password"} required value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...inputStyle, paddingRight: "2.5rem" }} />
                    <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0 }}>
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Confirmar nova senha</label>
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
                </div>

                {pwError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.625rem 0.75rem", color: C.error, fontSize: "0.875rem" }}>{pwError}</div>}

                <button type="submit" disabled={saving} style={{ background: C.gold, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.75rem", fontSize: "1rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  {pwSaved ? <><Check size={16} /> Senha alterada!</> : saving ? "Salvando..." : "Alterar senha"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
