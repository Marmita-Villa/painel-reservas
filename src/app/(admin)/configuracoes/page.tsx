"use client";

import { useState, useEffect } from "react";
import { Settings, Clock, Bell, CreditCard, Globe, Check, AlertCircle, Loader2, QrCode, Copy, Palette, Image } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { useSession } from "next-auth/react";
import { useRestaurant } from "@/contexts/RestaurantContext";
import PlanGate from "@/components/admin/PlanGate";

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? (typeof window !== "undefined" ? window.location.origin : "https://painel-reservas.onrender.com");

const tabs = [
  { id: "geral", label: "Geral", icon: Settings },
  { id: "horarios", label: "Horários", icon: Clock },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "pagamento", label: "Pagamento / No-Show", icon: CreditCard },
  { id: "integracoes", label: "Integrações", icon: Globe },
  { id: "widget", label: "Widget & QR", icon: QrCode },
];

const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type SaveState = "idle" | "saving" | "success" | "error";

interface Schedule {
  dayOfWeek: number;
  isActive: boolean;
  openTime: string;
  closeTime: string;
  slotInterval: number;
}

interface RestaurantSettings {
  autoConfirm: boolean;
  reminderHoursBefore: number;
  whatsappEnabled: boolean;
  noShowFeeEnabled: boolean;
  noShowFeeAmount: number | null;
  minNoticeMinutes: number;
  averageTicket: number | null;
}

const defaultSchedules: Schedule[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isActive: i > 0,
  openTime: "12:00",
  closeTime: "23:00",
  slotInterval: 30,
}));

const defaultSettings: RestaurantSettings = {
  autoConfirm: true,
  reminderHoursBefore: 24,
  whatsappEnabled: false,
  noShowFeeEnabled: false,
  noShowFeeAmount: null,
  minNoticeMinutes: 60,
  averageTicket: 0,
};

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const { effectiveRestaurantId } = useRestaurant();
  const restaurantId = effectiveRestaurantId ?? (session?.user as any)?.restaurantId as string | undefined;

  const [activeTab, setActiveTab] = useState("geral");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Geral fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f07316");
  const [logoUrl, setLogoUrl] = useState("");
  const [loadingGeral, setLoadingGeral] = useState(false);

  // Horários
  const [schedules, setSchedules] = useState<Schedule[]>(defaultSchedules);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [saveSchedules, setSaveSchedules] = useState<SaveState>("idle");

  // Settings (shared between Notificações and Pagamento)
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saveSettings, setSaveSettings] = useState<SaveState>("idle");

  // Widget
  const [copied, setCopied] = useState(false);
  const widgetUrl = slug ? `${BASE_URL}/r/${slug}` : "";
  const qrUrl = widgetUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(widgetUrl)}` : "";
  const embedCode = widgetUrl ? `<iframe src="${widgetUrl}" width="100%" height="700" frameborder="0" style="border-radius:12px;"></iframe>` : "";

  // Load restaurant data for Geral tab
  useEffect(() => {
    if (!restaurantId) return;
    setLoadingGeral(true);
    fetch(`/api/restaurants/${restaurantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
          setEmail(data.email ?? "");
          setAddress(data.address ?? "");
          setSlug(data.slug ?? "");
          setPrimaryColor(data.primaryColor ?? "#f07316");
          setLogoUrl(data.logoUrl ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoadingGeral(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Load schedules when horarios tab becomes active
  useEffect(() => {
    if (activeTab !== "horarios" || !restaurantId) return;
    setLoadingSchedules(true);
    fetch(`/api/restaurants/${restaurantId}/schedules`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSchedules(data);
      })
      .catch(() => {})
      .finally(() => setLoadingSchedules(false));
  }, [activeTab, restaurantId]);

  // Load settings when notificacoes or pagamento tab becomes active
  useEffect(() => {
    if (activeTab !== "notificacoes" && activeTab !== "pagamento") return;
    if (!restaurantId) return;
    setLoadingSettings(true);
    fetch(`/api/restaurants/${restaurantId}/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setSettings(data);
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, [activeTab, restaurantId]);

  function updateSchedule(index: number, field: keyof Schedule, value: any) {
    setSchedules((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  async function saveGeral() {
    if (!restaurantId) return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, address, primaryColor, logoUrl }),
      });
      if (res.ok) {
        setSaveState("success");
        setTimeout(() => setSaveState("idle"), 3000);
      } else {
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 3000);
      }
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  async function saveHorarios() {
    if (!restaurantId) return;
    setSaveSchedules("saving");
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/schedules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedules),
      });
      if (res.ok) {
        setSaveSchedules("success");
        setTimeout(() => setSaveSchedules("idle"), 3000);
      } else {
        setSaveSchedules("error");
        setTimeout(() => setSaveSchedules("idle"), 3000);
      }
    } catch {
      setSaveSchedules("error");
      setTimeout(() => setSaveSchedules("idle"), 3000);
    }
  }

  async function saveSettingsData() {
    if (!restaurantId) return;
    setSaveSettings("saving");
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveSettings("success");
        setTimeout(() => setSaveSettings("idle"), 3000);
      } else {
        setSaveSettings("error");
        setTimeout(() => setSaveSettings("idle"), 3000);
      }
    } catch {
      setSaveSettings("error");
      setTimeout(() => setSaveSettings("idle"), 3000);
    }
  }

  function handleCopyUrl() {
    if (!widgetUrl) return;
    navigator.clipboard.writeText(widgetUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadQr() {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `qrcode-${slug}.png`;
    a.target = "_blank";
    a.click();
  }

  const slotIntervalOptions = [
    { value: 30, label: "30 min" },
    { value: 60, label: "1 hora" },
    { value: 120, label: "2 horas" },
  ];

  const reminderOptions = [
    { value: 2, label: "2 horas antes" },
    { value: 6, label: "6 horas antes" },
    { value: 12, label: "12 horas antes" },
    { value: 24, label: "24 horas antes" },
    { value: 48, label: "48 horas antes" },
  ];

  const cancellationOptions = [
    { value: 120, label: "2 horas antes" },
    { value: 240, label: "4 horas antes" },
    { value: 1440, label: "24 horas antes" },
    { value: 2880, label: "48 horas antes" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Configurações
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Personalize o sistema para o seu restaurante
        </p>
      </div>

      <div className="flex gap-6">
        {/* Tab nav */}
        <div
          className="w-48 flex-shrink-0 rounded-xl border p-2 h-fit"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all mb-1 last:mb-0"
              style={{
                background: activeTab === id ? "var(--primary)" : "transparent",
                color: activeTab === id ? "white" : "var(--foreground-muted)",
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1">
          {activeTab === "geral" && (
            <div
              className="rounded-xl border p-6 space-y-5"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Informações do Restaurante</h2>

              {loadingGeral ? (
                <div className="flex items-center gap-2 py-4" style={{ color: "var(--foreground-muted)" }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Carregando dados...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                        Nome do restaurante
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ristorante Roma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                        Telefone
                      </label>
                      <input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="contato@restaurante.com.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                        Endereço
                      </label>
                      <input
                        type="text"
                        placeholder="Rua, número, bairro"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                  </div>

                  {/* Identidade Visual */}
                  <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
                    <p className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                      <Palette size={14} /> Identidade Visual
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                          Cor da marca
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                            title="Escolher cor"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            placeholder="#f07316"
                            className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none font-mono"
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                          />
                          <div className="w-9 h-9 rounded-lg flex-shrink-0 border"
                            style={{ background: primaryColor, borderColor: "var(--border)" }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                          Usada no cardápio digital e widget público
                        </p>
                      </div>
                      <div>
                        <ImageUpload
                          label="Logotipo"
                          value={logoUrl}
                          onChange={setLogoUrl}
                          folder="reserva360/logos"
                          aspectRatio="wide"
                          hint="JPG, PNG, SVG — máx. 5MB"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveGeral}
                      disabled={saveState === "saving"}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                      style={{ background: "var(--primary)" }}
                    >
                      {saveState === "saving" ? (
                        <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                      ) : (
                        "Salvar alterações"
                      )}
                    </button>

                    {saveState === "success" && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--success)" }}>
                        <Check size={14} /> Salvo com sucesso!
                      </span>
                    )}
                    {saveState === "error" && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--danger)" }}>
                        <AlertCircle size={14} /> Erro ao salvar. Tente novamente.
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "horarios" && (
            <div
              className="rounded-xl border p-6 space-y-4"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Horários de Funcionamento</h2>

              {loadingSchedules ? (
                <div className="flex items-center gap-2 py-4" style={{ color: "var(--foreground-muted)" }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Carregando horários...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {schedules.map((s, i) => (
                      <div key={s.dayOfWeek} className="flex items-center gap-4 flex-wrap">
                        <div className="w-24 text-sm" style={{ color: "var(--foreground)" }}>{days[i]}</div>
                        <input
                          type="checkbox"
                          checked={s.isActive}
                          onChange={(e) => updateSchedule(i, "isActive", e.target.checked)}
                          className="accent-purple-500"
                        />
                        <input
                          type="time"
                          value={s.openTime}
                          onChange={(e) => updateSchedule(i, "openTime", e.target.value)}
                          disabled={!s.isActive}
                          className="px-2 py-1.5 rounded-lg text-sm outline-none disabled:opacity-40"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        />
                        <span style={{ color: "var(--foreground-muted)" }}>até</span>
                        <input
                          type="time"
                          value={s.closeTime}
                          onChange={(e) => updateSchedule(i, "closeTime", e.target.value)}
                          disabled={!s.isActive}
                          className="px-2 py-1.5 rounded-lg text-sm outline-none disabled:opacity-40"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        />
                        <select
                          value={s.slotInterval}
                          onChange={(e) => updateSchedule(i, "slotInterval", Number(e.target.value))}
                          disabled={!s.isActive}
                          className="px-2 py-1.5 rounded-lg text-sm outline-none disabled:opacity-40"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        >
                          {slotIntervalOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={saveHorarios}
                      disabled={saveSchedules === "saving"}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                      style={{ background: "var(--primary)" }}
                    >
                      {saveSchedules === "saving" ? (
                        <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                      ) : (
                        "Salvar horários"
                      )}
                    </button>
                    {saveSchedules === "success" && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--success)" }}>
                        <Check size={14} /> Salvo com sucesso!
                      </span>
                    )}
                    {saveSchedules === "error" && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--danger)" }}>
                        <AlertCircle size={14} /> Erro ao salvar. Tente novamente.
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "notificacoes" && (
            <div
              className="rounded-xl border p-6 space-y-5"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Notificações Automáticas</h2>

              {loadingSettings ? (
                <div className="flex items-center gap-2 py-4" style={{ color: "var(--foreground-muted)" }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Carregando configurações...</span>
                </div>
              ) : (
                <>
                  {/* Confirmação automática */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Confirmação automática</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>Confirmar reserva online automaticamente</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoConfirm}
                      onChange={(e) => setSettings((s) => ({ ...s, autoConfirm: e.target.checked }))}
                      className="accent-purple-500 mt-1"
                    />
                  </div>

                  {/* Lembrete de reserva */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Lembrete de reserva</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>Enviar lembrete ao cliente antes da reserva</p>
                      <select
                        value={settings.reminderHoursBefore}
                        onChange={(e) => setSettings((s) => ({ ...s, reminderHoursBefore: Number(e.target.value) }))}
                        className="mt-2 px-3 py-1.5 rounded-lg text-sm outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      >
                        {reminderOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <PlanGate requiredPlan="PRO" feature="WhatsApp automático de confirmações e lembretes">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>WhatsApp ativo</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                          Usar WhatsApp Business para notificações.{" "}
                          <span style={{ color: "var(--primary)" }}>Configure as chaves da API na aba Integrações</span>
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.whatsappEnabled}
                        onChange={(e) => setSettings((s) => ({ ...s, whatsappEnabled: e.target.checked }))}
                        className="accent-purple-500 mt-1"
                      />
                    </div>
                  </PlanGate>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={saveSettingsData}
                      disabled={saveSettings === "saving"}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                      style={{ background: "var(--primary)" }}
                    >
                      {saveSettings === "saving" ? (
                        <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                      ) : (
                        "Salvar configurações"
                      )}
                    </button>
                    {saveSettings === "success" && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--success)" }}>
                        <Check size={14} /> Salvo com sucesso!
                      </span>
                    )}
                    {saveSettings === "error" && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--danger)" }}>
                        <AlertCircle size={14} /> Erro ao salvar. Tente novamente.
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "pagamento" && (
            <div
              className="rounded-xl border p-6 space-y-5"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Garantia de Reserva (No-Show)</h2>

              {loadingSettings ? (
                <div className="flex items-center gap-2 py-4" style={{ color: "var(--foreground-muted)" }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Carregando configurações...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Ativar taxa de no-show</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                        Cobrar um valor do cliente caso não compareça
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.noShowFeeEnabled}
                      onChange={(e) => setSettings((s) => ({ ...s, noShowFeeEnabled: e.target.checked }))}
                      className="accent-purple-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      Valor da taxa (R$)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 50.00"
                      value={settings.noShowFeeAmount ?? ""}
                      onChange={(e) => setSettings((s) => ({ ...s, noShowFeeAmount: e.target.value === "" ? null : Number(e.target.value) }))}
                      disabled={!settings.noShowFeeEnabled}
                      className="w-40 px-3 py-2.5 rounded-lg text-sm outline-none disabled:opacity-40"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      Prazo de cancelamento gratuito
                    </label>
                    <select
                      value={settings.minNoticeMinutes}
                      onChange={(e) => setSettings((s) => ({ ...s, minNoticeMinutes: Number(e.target.value) }))}
                      className="px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    >
                      {cancellationOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      Ticket médio por pessoa (R$)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 85.00"
                      value={settings.averageTicket ?? ""}
                      onChange={(e) => setSettings((s) => ({ ...s, averageTicket: e.target.value === "" ? null : Number(e.target.value) }))}
                      className="w-40 px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                      Usado para calcular a receita estimada no dashboard
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveSettingsData}
                      disabled={saveSettings === "saving"}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                      style={{ background: "var(--primary)" }}
                    >
                      {saveSettings === "saving" ? (
                        <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                      ) : (
                        "Salvar configurações"
                      )}
                    </button>
                    {saveSettings === "success" && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--success)" }}>
                        <Check size={14} /> Salvo com sucesso!
                      </span>
                    )}
                    {saveSettings === "error" && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--danger)" }}>
                        <AlertCircle size={14} /> Erro ao salvar. Tente novamente.
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "integracoes" && (
            <div className="space-y-4">
              <div
                className="rounded-xl border p-6 space-y-4"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Integrações</h2>
                {[
                  { name: "Google Reserve", desc: "Aceitar reservas direto do Google Meu Negócio", connected: true },
                  {
                    name: "WhatsApp Business",
                    desc: "Enviar confirmações e lembretes via WhatsApp",
                    connected: settings.whatsappEnabled,
                  },
                  { name: "Instagram", desc: "Link de reservas na bio e stories", connected: false },
                  { name: "iFood", desc: "Sincronizar disponibilidade com o iFood", connected: false },
                ].map((integ) => (
                  <div
                    key={integ.name}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{integ.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{integ.desc}</p>
                    </div>
                    <button
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{
                        background: integ.connected ? "var(--success)20" : "var(--primary)",
                        color: integ.connected ? "var(--success)" : "white",
                      }}
                    >
                      {integ.connected ? "Conectado" : "Conectar"}
                    </button>
                  </div>
                ))}
              </div>

              {/* WhatsApp Business API configuration */}
              <div
                className="rounded-xl border p-6 space-y-4"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>WhatsApp Business API</h3>
                  {settings.whatsappEnabled && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: "var(--success)20", color: "var(--success)" }}
                    >
                      Ativo
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                    WHATSAPP_PHONE_NUMBER_ID
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    className="w-full max-w-sm px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    readOnly
                  />
                  <p className="text-xs mt-1.5" style={{ color: "var(--foreground-muted)" }}>
                    Configure as variáveis de ambiente no servidor. Ative o WhatsApp na aba Notificações.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "widget" && (
            <div
              className="rounded-xl border p-6 space-y-6"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Widget de Reservas & QR Code</h2>

              {/* Widget URL */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                  URL do Widget Público
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={widgetUrl || (loadingGeral ? "Carregando..." : "Configure o slug do restaurante")}
                    className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none font-mono"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                  <button
                    onClick={handleCopyUrl}
                    disabled={!widgetUrl}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: copied ? "var(--success)20" : "var(--surface-2)", color: copied ? "var(--success)" : "var(--foreground-muted)", border: "1px solid var(--border)" }}
                  >
                    {copied ? <><Check size={13} /> Copiado!</> : <><Copy size={13} /> Copiar</>}
                  </button>
                  {widgetUrl && (
                    <a
                      href={widgetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-80"
                      style={{ background: "var(--primary)" }}
                    >
                      Abrir
                    </a>
                  )}
                </div>
              </div>

              {/* QR Code */}
              {widgetUrl && (
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: "var(--foreground-muted)" }}>
                    QR Code
                  </label>
                  <div className="flex items-start gap-6">
                    <div
                      className="p-3 rounded-xl border"
                      style={{ background: "white", borderColor: "var(--border)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrUrl}
                        alt="QR Code do Widget"
                        width={200}
                        height={200}
                        style={{ display: "block" }}
                      />
                    </div>
                    <div className="space-y-3 pt-2">
                      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                        Imprima este QR Code e disponibilize nas mesas ou na entrada para que os clientes façam reservas diretamente pelo celular.
                      </p>
                      <button
                        onClick={handleDownloadQr}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                        style={{ background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                      >
                        Baixar QR Code
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Embed code — reservas */}
              {widgetUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                    Incorporar Widget de Reservas (iFrame)
                  </label>
                  <p className="text-xs mb-2" style={{ color: "var(--foreground-muted)" }}>
                    Cole este código no seu site para exibir o widget de reservas diretamente.
                  </p>
                  <textarea
                    readOnly
                    value={embedCode}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg text-xs outline-none font-mono resize-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              )}

              {/* ── CARDÁPIO DIGITAL ── */}
              {slug && (
                <>
                  <div className="border-t pt-6" style={{ borderColor: "var(--border)" }}>
                    <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Cardápio Digital</h3>
                    <p className="text-xs mb-4" style={{ color: "var(--foreground-muted)" }}>
                      Página standalone do cardápio — compartilhe nas redes sociais, Google Meu Negócio ou incorpore no seu site.
                    </p>

                    {/* Menu URL */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                        Link do Cardápio
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${BASE_URL}/menu/${slug}`}
                          className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none font-mono"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        />
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${BASE_URL}/menu/${slug}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                          style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
                        >
                          <Copy size={13} /> Copiar
                        </button>
                        <a
                          href={`/menu/${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-80"
                          style={{ background: "var(--primary)" }}
                        >
                          Abrir
                        </a>
                      </div>
                    </div>

                    {/* QR Code do menu */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-3" style={{ color: "var(--foreground-muted)" }}>
                        QR Code do Cardápio
                      </label>
                      <div className="flex items-start gap-6">
                        <div className="p-3 rounded-xl border flex-shrink-0"
                          style={{ background: "white", borderColor: "var(--border)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${BASE_URL}/menu/${slug}`)}`}
                            alt="QR Code do Cardápio"
                            width={160}
                            height={160}
                            style={{ display: "block" }}
                          />
                        </div>
                        <div className="space-y-2 pt-2">
                          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                            Imprima e coloque na mesa ou na entrada — o cliente aponta a câmera e vê o cardápio completo.
                          </p>
                          <button
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${BASE_URL}/menu/${slug}`)}`;
                              a.download = `qr-cardapio-${slug}.png`;
                              a.target = "_blank";
                              a.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                            style={{ background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                          >
                            Baixar QR Code
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Embed cardápio */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                        Incorporar Cardápio no Site (iFrame)
                      </label>
                      <p className="text-xs mb-2" style={{ color: "var(--foreground-muted)" }}>
                        Cole no seu site para exibir o cardápio completo diretamente na página.
                      </p>
                      <textarea
                        readOnly
                        value={`<iframe src="${BASE_URL}/menu/${slug}" width="100%" height="800" frameborder="0" style="border-radius:16px;border:none;"></iframe>`}
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-lg text-xs outline-none font-mono resize-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
