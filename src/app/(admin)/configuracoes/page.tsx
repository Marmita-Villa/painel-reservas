"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Clock, Bell, CreditCard, Globe, Check, AlertCircle, Loader2, QrCode, Copy } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRestaurant } from "@/contexts/RestaurantContext";

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
  const [loadingGeral, setLoadingGeral] = useState(false);

  // Pagamento fields
  const [averageTicket, setAverageTicket] = useState<string>("");

  // Widget
  const [copied, setCopied] = useState(false);
  const widgetUrl = slug ? `${BASE_URL}/r/${slug}` : "";
  const qrUrl = widgetUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(widgetUrl)}` : "";
  const embedCode = widgetUrl ? `<iframe src="${widgetUrl}" width="100%" height="700" frameborder="0" style="border-radius:12px;"></iframe>` : "";

  // Load restaurant data when tab is active or restaurantId changes
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
        }
      })
      .catch(() => {})
      .finally(() => setLoadingGeral(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  async function saveGeral() {
    if (!restaurantId) return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, address }),
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
              <div className="space-y-3">
                {days.map((day, i) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 text-sm" style={{ color: "var(--foreground)" }}>{day}</div>
                    <input
                      type="checkbox"
                      defaultChecked={i > 0 && i < 7}
                      className="accent-purple-500"
                    />
                    <input
                      type="time"
                      defaultValue="12:00"
                      className="px-2 py-1.5 rounded-lg text-sm outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                    <span style={{ color: "var(--foreground-muted)" }}>até</span>
                    <input
                      type="time"
                      defaultValue="23:00"
                      className="px-2 py-1.5 rounded-lg text-sm outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white mt-2"
                style={{ background: "var(--primary)" }}
              >
                Salvar horários
              </button>
            </div>
          )}

          {activeTab === "notificacoes" && (
            <div
              className="rounded-xl border p-6 space-y-5"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Notificações Automáticas</h2>
              {[
                { label: "Lembrete de reserva", desc: "Enviar lembrete ao cliente antes da reserva", defaultChecked: true },
                { label: "Confirmação automática", desc: "Confirmar reserva online automaticamente", defaultChecked: true },
                { label: "Aviso de no-show", desc: "Notificar equipe sobre possível no-show", defaultChecked: false },
                { label: "WhatsApp ativo", desc: "Usar WhatsApp Business para notificações", defaultChecked: false },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{item.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked={item.defaultChecked} className="accent-purple-500 mt-1" />
                </div>
              ))}
            </div>
          )}

          {activeTab === "pagamento" && (
            <div
              className="rounded-xl border p-6 space-y-5"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Garantia de Reserva (No-Show)</h2>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Ativar taxa de no-show</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                    Cobrar um valor do cliente caso não compareça
                  </p>
                </div>
                <input type="checkbox" className="accent-purple-500 mt-1" />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Valor da taxa (R$)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 50.00"
                  className="w-40 px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Prazo de cancelamento gratuito
                </label>
                <select
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <option>2 horas antes</option>
                  <option>4 horas antes</option>
                  <option>24 horas antes</option>
                  <option>48 horas antes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Ticket médio por pessoa (R$)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 85.00"
                  value={averageTicket}
                  onChange={(e) => setAverageTicket(e.target.value)}
                  className="w-40 px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                  Usado para calcular a receita estimada no dashboard
                </p>
              </div>
              <button
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--primary)" }}
              >
                Salvar configurações
              </button>
            </div>
          )}

          {activeTab === "integracoes" && (
            <div
              className="rounded-xl border p-6 space-y-4"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Integrações</h2>
              {[
                { name: "Google Reserve", desc: "Aceitar reservas direto do Google Meu Negócio", connected: true },
                { name: "WhatsApp Business", desc: "Enviar confirmações e lembretes via WhatsApp", connected: false },
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

              {/* Embed code */}
              {widgetUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                    Código de Incorporação (iFrame)
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
