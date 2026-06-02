"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  User,
  Users,
  CalendarDays,
  Clock,
  MapPin,
  ChevronDown,
  Phone,
  Star,
  AlertTriangle,
  Check,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NovaReservaModalProps {
  open: boolean;
  onClose: () => void;
  preselectedTable?: string;
}

const mockCustomers = [
  { id: "1", name: "João Silva", phone: "(11) 99999-1234", visits: 12, noShows: 0 },
  { id: "2", name: "Maria Oliveira", phone: "(21) 98888-5678", visits: 5, noShows: 1 },
  { id: "3", name: "Carlos Santos", phone: "(11) 97777-9012", visits: 8, noShows: 0 },
  { id: "4", name: "Ana Costa", phone: "(31) 96666-3456", visits: 2, noShows: 2 },
  { id: "5", name: "Pedro Almeida", phone: "(11) 95555-7890", visits: 20, noShows: 0 },
  { id: "6", name: "Fernanda Lima", phone: "(11) 94444-1111", visits: 3, noShows: 0 },
];

const tables = [
  { id: "1", name: "Mesa 1", capacity: 2, status: "free" },
  { id: "2", name: "Mesa 2", capacity: 4, status: "occupied" },
  { id: "3", name: "Mesa 3", capacity: 2, status: "free" },
  { id: "4", name: "Mesa 4", capacity: 6, status: "free" },
  { id: "5", name: "Mesa 5", capacity: 4, status: "reserved" },
  { id: "6", name: "Mesa 6", capacity: 4, status: "free" },
  { id: "7", name: "Mesa 7", capacity: 8, status: "free" },
  { id: "8", name: "Mesa 8", capacity: 2, status: "blocked" },
  { id: "9", name: "Mesa 9", capacity: 4, status: "free" },
];

const slots = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
];

const origins = [
  { value: "INTERNAL", label: "Interno" },
  { value: "PHONE", label: "Telefone" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "GOOGLE", label: "Google" },
  { value: "INSTAGRAM", label: "Instagram" },
];

const occasions = ["", "Aniversário", "Casamento", "Noivado", "Formatura", "Reunião", "Outro"];

type Step = "cliente" | "detalhes" | "mesa" | "confirmar";

export default function NovaReservaModal({ open, onClose, preselectedTable }: NovaReservaModalProps) {
  const [step, setStep] = useState<Step>("cliente");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<typeof mockCustomers[0] | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedTable, setSelectedTable] = useState(preselectedTable || "");
  const [notes, setNotes] = useState("");
  const [occasion, setOccasion] = useState("");
  const [origin, setOrigin] = useState("INTERNAL");
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("cliente");
        setSelectedCustomer(null);
        setCustomerSearch("");
        setIsNewCustomer(false);
        setNewCustomer({ name: "", phone: "" });
        setTime("");
        setPartySize(2);
        setSelectedTable(preselectedTable || "");
        setNotes("");
        setOccasion("");
        setOrigin("INTERNAL");
        setSuccess(false);
      }, 300);
    }
  }, [open, preselectedTable]);

  if (!open) return null;

  const steps: { id: Step; label: string }[] = [
    { id: "cliente", label: "Cliente" },
    { id: "detalhes", label: "Detalhes" },
    { id: "mesa", label: "Mesa" },
    { id: "confirmar", label: "Confirmar" },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);
  const customerName = isNewCustomer ? newCustomer.name : selectedCustomer?.name;
  const customerPhone = isNewCustomer ? newCustomer.phone : selectedCustomer?.phone;
  const tableName = tables.find((t) => t.id === selectedTable)?.name;

  const canGoNext = () => {
    if (step === "cliente") return isNewCustomer ? newCustomer.name && newCustomer.phone : !!selectedCustomer;
    if (step === "detalhes") return !!date && !!time && partySize > 0;
    if (step === "mesa") return !!selectedTable;
    return true;
  };

  const handleSubmit = () => {
    setSuccess(true);
    setTimeout(() => onClose(), 2000);
  };

  const availableTables = tables.filter(
    (t) => t.status === "free" && t.capacity >= partySize
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
              Nova Reserva
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
              Preencha os dados abaixo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: "var(--foreground-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 py-4 gap-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: i < stepIndex ? "var(--success)" : i === stepIndex ? "var(--primary)" : "var(--surface-2)",
                    color: i <= stepIndex ? "white" : "var(--foreground-muted)",
                  }}
                >
                  {i < stepIndex ? <Check size={12} /> : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: i === stepIndex ? "var(--foreground)" : "var(--foreground-muted)" }}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-px mx-2"
                  style={{ background: i < stepIndex ? "var(--success)" : "var(--border)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "var(--success)20" }}
              >
                <Check size={32} style={{ color: "var(--success)" }} />
              </div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                Reserva criada!
              </h3>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                {customerName} · {tableName} · {date} às {time}
              </p>
            </div>
          ) : (
            <>
              {/* STEP: CLIENTE */}
              {step === "cliente" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsNewCustomer(false)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: !isNewCustomer ? "var(--primary)" : "var(--surface-2)",
                        color: !isNewCustomer ? "white" : "var(--foreground-muted)",
                        border: `1px solid ${!isNewCustomer ? "var(--primary)" : "var(--border)"}`,
                      }}
                    >
                      Buscar cliente
                    </button>
                    <button
                      onClick={() => setIsNewCustomer(true)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: isNewCustomer ? "var(--primary)" : "var(--surface-2)",
                        color: isNewCustomer ? "white" : "var(--foreground-muted)",
                        border: `1px solid ${isNewCustomer ? "var(--primary)" : "var(--border)"}`,
                      }}
                    >
                      <Plus size={14} className="inline mr-1" />
                      Novo cliente
                    </button>
                  </div>

                  {!isNewCustomer ? (
                    <>
                      <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Nome ou telefone..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                          style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCustomer(c)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                            style={{
                              background: selectedCustomer?.id === c.id ? "var(--primary)20" : "var(--surface-2)",
                              border: `1px solid ${selectedCustomer?.id === c.id ? "var(--primary)" : "var(--border)"}`,
                            }}
                          >
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                              style={{ background: "var(--primary)" }}
                            >
                              {c.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{c.name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{c.phone}</span>
                                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--warning)" }}>
                                  <Star size={10} /> {c.visits}x
                                </span>
                                {c.noShows > 0 && (
                                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--danger)" }}>
                                    <AlertTriangle size={10} /> {c.noShows} no-show
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedCustomer?.id === c.id && (
                              <Check size={16} style={{ color: "var(--primary)" }} />
                            )}
                          </button>
                        ))}
                        {filteredCustomers.length === 0 && (
                          <p className="text-sm text-center py-4" style={{ color: "var(--foreground-muted)" }}>
                            Nenhum cliente encontrado
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
                          Nome completo *
                        </label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Nome do cliente"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                            style={{
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              color: "var(--foreground)",
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
                          Telefone / WhatsApp *
                        </label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
                          <input
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                            style={{
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              color: "var(--foreground)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: DETALHES */}
              {step === "detalhes" && (
                <div className="space-y-4">
                  {/* Customer summary */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: "var(--primary)" }}
                    >
                      {customerName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{customerName}</p>
                      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{customerPhone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
                        Data *
                      </label>
                      <div className="relative">
                        <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
                        <input
                          type="date"
                          value={date}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
                          style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
                        Pessoas *
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                          className="w-10 h-10 rounded-lg text-lg font-bold flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        >
                          −
                        </button>
                        <div
                          className="flex-1 text-center py-2 rounded-lg font-semibold"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        >
                          {partySize}
                        </div>
                        <button
                          onClick={() => setPartySize((p) => Math.min(20, p + 1))}
                          className="w-10 h-10 rounded-lg text-lg font-bold flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
                      Horário *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setTime(slot)}
                          className="py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            background: time === slot ? "var(--primary)" : "var(--surface-2)",
                            color: time === slot ? "white" : "var(--foreground-muted)",
                            border: `1px solid ${time === slot ? "var(--primary)" : "var(--border)"}`,
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
                        Origem
                      </label>
                      <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        {origins.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
                        Ocasião
                      </label>
                      <select
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        {occasions.map((o) => (
                          <option key={o} value={o}>{o || "Nenhuma"}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--foreground-muted)" }}>
                      Observações
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Alergias, preferências, pedidos especiais..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* STEP: MESA */}
              {step === "mesa" && (
                <div className="space-y-4">
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                    Mesas disponíveis para <strong style={{ color: "var(--foreground)" }}>{partySize} pessoas</strong> em{" "}
                    <strong style={{ color: "var(--foreground)" }}>{date} às {time}</strong>
                  </p>

                  {availableTables.length === 0 ? (
                    <div className="text-center py-8" style={{ color: "var(--foreground-muted)" }}>
                      <MapPin size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Nenhuma mesa disponível para esses critérios</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availableTables.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTable(t.id)}
                          className="p-4 rounded-xl text-left transition-all"
                          style={{
                            background: selectedTable === t.id ? "var(--primary)20" : "var(--surface-2)",
                            border: `2px solid ${selectedTable === t.id ? "var(--primary)" : "var(--border)"}`,
                          }}
                        >
                          <p className="font-bold text-base" style={{ color: "var(--foreground)" }}>{t.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users size={12} style={{ color: "var(--foreground-muted)" }} />
                            <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                              até {t.capacity}
                            </span>
                          </div>
                          {selectedTable === t.id && (
                            <div className="mt-2">
                              <Check size={14} style={{ color: "var(--primary)" }} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    className="text-sm underline"
                    style={{ color: "var(--foreground-muted)" }}
                    onClick={() => setSelectedTable("")}
                  >
                    Continuar sem selecionar mesa
                  </button>
                </div>
              )}

              {/* STEP: CONFIRMAR */}
              {step === "confirmar" && (
                <div className="space-y-3">
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      Resumo da reserva
                    </h3>
                    {[
                      { icon: User, label: "Cliente", value: customerName },
                      { icon: Phone, label: "Telefone", value: customerPhone },
                      { icon: CalendarDays, label: "Data", value: date },
                      { icon: Clock, label: "Horário", value: time },
                      { icon: Users, label: "Pessoas", value: `${partySize} pessoa${partySize > 1 ? "s" : ""}` },
                      { icon: MapPin, label: "Mesa", value: tableName || "A definir" },
                      ...(occasion ? [{ icon: Star, label: "Ocasião", value: occasion }] : []),
                      ...(notes ? [{ icon: ChevronDown, label: "Obs.", value: notes }] : []),
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-3">
                        <Icon size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--foreground-muted)" }} />
                        <div className="flex-1 flex justify-between">
                          <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                          <span className="text-xs font-medium text-right" style={{ color: "var(--foreground)" }}>{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
                    Um lembrete será enviado automaticamente ao cliente antes da reserva.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div
            className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              onClick={() => {
                const idx = stepIndex;
                if (idx === 0) onClose();
                else setStep(steps[idx - 1].id);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground-muted)",
              }}
            >
              {stepIndex === 0 ? "Cancelar" : "Voltar"}
            </button>

            {step !== "confirmar" ? (
              <button
                onClick={() => setStep(steps[stepIndex + 1].id)}
                disabled={!canGoNext()}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-medium text-white transition-all",
                  !canGoNext() && "opacity-40 cursor-not-allowed"
                )}
                style={{ background: "var(--primary)" }}
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--success)" }}
              >
                ✓ Confirmar Reserva
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
