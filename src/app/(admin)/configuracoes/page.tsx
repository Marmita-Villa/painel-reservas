"use client";

import { useState } from "react";
import { Settings, Clock, Bell, CreditCard, Globe } from "lucide-react";

const tabs = [
  { id: "geral", label: "Geral", icon: Settings },
  { id: "horarios", label: "Horários", icon: Clock },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "pagamento", label: "Pagamento / No-Show", icon: CreditCard },
  { id: "integracoes", label: "Integrações", icon: Globe },
];

const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("geral");

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
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Nome do restaurante", placeholder: "Ex: Ristorante Roma", type: "text" },
                  { label: "Telefone", placeholder: "(11) 99999-9999", type: "tel" },
                  { label: "Email", placeholder: "contato@restaurante.com.br", type: "email" },
                  { label: "Endereço", placeholder: "Rua, número, bairro", type: "text" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--primary)" }}
              >
                Salvar alterações
              </button>
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
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                    <span style={{ color: "var(--foreground-muted)" }}>até</span>
                    <input
                      type="time"
                      defaultValue="23:00"
                      className="px-2 py-1.5 rounded-lg text-sm outline-none"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
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
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Prazo de cancelamento gratuito
                </label>
                <select
                  className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  <option>2 horas antes</option>
                  <option>4 horas antes</option>
                  <option>24 horas antes</option>
                  <option>48 horas antes</option>
                </select>
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
        </div>
      </div>
    </div>
  );
}
