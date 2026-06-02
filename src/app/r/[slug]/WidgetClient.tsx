"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Phone,
  User,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  coverUrl: string | null;
  logoUrl: string | null;
  primaryColor: string;
  phone: string;
  availableSlots: { date: string; times: string[] }[];
}

type Step = "inicio" | "data" | "hora" | "pessoas" | "dados" | "confirmar" | "sucesso";

const partySizes = [1, 2, 3, 4, 5, 6, 7, 8];

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    day: d,
    dayName: dayNames[date.getDay()],
    month: monthNames[m - 1],
    year: y,
    full: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
    weekday: date.getDay(),
  };
}

export default function WidgetClient({ restaurant }: { restaurant: Restaurant }) {
  const [step, setStep] = useState<Step>("inicio");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [occasion, setOccasion] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const primary = restaurant.primaryColor;

  // Build week days from today + offset
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + weekOffset * 7 + i);
    return d.toISOString().split("T")[0];
  });

  const availableMap = new Map(
    restaurant.availableSlots.map((s) => [s.date, s.times])
  );

  const timesForDate = selectedDate ? (availableMap.get(selectedDate) || []) : [];

  const lunchTimes = timesForDate.filter((t) => {
    const h = parseInt(t.split(":")[0]);
    return h < 17;
  });
  const dinnerTimes = timesForDate.filter((t) => {
    const h = parseInt(t.split(":")[0]);
    return h >= 17;
  });

  const stepOrder: Step[] = ["inicio", "data", "hora", "pessoas", "dados", "confirmar", "sucesso"];
  const stepIdx = stepOrder.indexOf(step);

  const goBack = () => {
    if (stepIdx > 0) setStep(stepOrder[stepIdx - 1]);
  };

  const progressSteps = [
    { id: "data", label: "Data" },
    { id: "hora", label: "Hora" },
    { id: "pessoas", label: "Pessoas" },
    { id: "dados", label: "Dados" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md flex flex-col min-h-screen">

        {/* TELA INICIAL */}
        {step === "inicio" && (
          <div className="flex flex-col flex-1">
            {/* Cover */}
            <div
              className="h-48 w-full relative flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${primary}cc, ${primary}44)` }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg"
                  style={{ background: primary }}
                >
                  {restaurant.name[0]}
                </div>
                <h1 className="text-xl font-bold text-white">{restaurant.name}</h1>
                <p className="text-sm text-white/80 mt-1">{restaurant.description}</p>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-5 space-y-4">
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: primary }} />
                  <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{restaurant.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} style={{ color: primary }} />
                  <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{restaurant.phone}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => setStep("data")}
                className="w-full py-4 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                style={{ background: primary }}
              >
                <CalendarDays size={20} />
                Reservar mesa
                <ArrowRight size={18} />
              </button>

              <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
                Confirmação instantânea · Sem taxas
              </p>
            </div>
          </div>
        )}

        {/* TELAS COM PROGRESS BAR */}
        {step !== "inicio" && step !== "sucesso" && (
          <>
            {/* Header com back e progresso */}
            <div
              className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
              style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
            >
              <button
                onClick={goBack}
                className="p-2 rounded-xl transition-opacity hover:opacity-60"
                style={{ background: "var(--surface)", color: "var(--foreground)" }}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1 flex gap-1.5">
                {progressSteps.map((ps, i) => {
                  const psIdx = progressSteps.findIndex((x) => x.id === step);
                  const done = i < psIdx;
                  const active = i === psIdx;
                  return (
                    <div
                      key={ps.id}
                      className="flex-1 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        background: done || active ? primary : "var(--border)",
                        opacity: done ? 0.6 : 1,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">

              {/* STEP: DATA */}
              {step === "data" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                      Qual data?
                    </h2>
                    <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                      Escolha o dia da sua visita
                    </p>
                  </div>

                  {/* Week navigation */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                      disabled={weekOffset === 0}
                      className="p-2 rounded-xl disabled:opacity-30"
                      style={{ background: "var(--surface)", color: "var(--foreground)" }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>
                      {weekOffset === 0 ? "Esta semana" : `+${weekOffset * 7} dias`}
                    </span>
                    <button
                      onClick={() => setWeekOffset((w) => w + 1)}
                      className="p-2 rounded-xl"
                      style={{ background: "var(--surface)", color: "var(--foreground)" }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {weekDays.map((dateStr) => {
                      const fmt = formatDateBR(dateStr);
                      const hasSlots = availableMap.has(dateStr);
                      const isSelected = selectedDate === dateStr;
                      const isPast = new Date(dateStr) < new Date(today.toISOString().split("T")[0]);

                      return (
                        <button
                          key={dateStr}
                          disabled={!hasSlots || isPast}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setSelectedTime("");
                            setStep("hora");
                          }}
                          className={cn(
                            "flex flex-col items-center py-3 rounded-xl transition-all active:scale-95",
                            (!hasSlots || isPast) && "opacity-30 cursor-not-allowed"
                          )}
                          style={{
                            background: isSelected ? primary : "var(--surface)",
                            border: `2px solid ${isSelected ? primary : "var(--border)"}`,
                          }}
                        >
                          <span className="text-xs" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "var(--foreground-muted)" }}>
                            {fmt.dayName}
                          </span>
                          <span className="text-lg font-bold mt-0.5" style={{ color: isSelected ? "white" : "var(--foreground)" }}>
                            {fmt.day}
                          </span>
                          {hasSlots && !isPast && (
                            <div
                              className="w-1.5 h-1.5 rounded-full mt-1"
                              style={{ background: isSelected ? "white" : primary }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <p className="text-sm text-center font-medium" style={{ color: primary }}>
                      {formatDateBR(selectedDate).dayName}, {formatDateBR(selectedDate).day} de {formatDateBR(selectedDate).month}
                    </p>
                  )}
                </div>
              )}

              {/* STEP: HORA */}
              {step === "hora" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                      Que horas?
                    </h2>
                    <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                      {formatDateBR(selectedDate).dayName}, {formatDateBR(selectedDate).day} de {formatDateBR(selectedDate).month}
                    </p>
                  </div>

                  {lunchTimes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--foreground-muted)" }}>
                        Almoço
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {lunchTimes.map((t) => (
                          <button
                            key={t}
                            onClick={() => { setSelectedTime(t); setStep("pessoas"); }}
                            className="py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                            style={{
                              background: selectedTime === t ? primary : "var(--surface)",
                              color: selectedTime === t ? "white" : "var(--foreground)",
                              border: `2px solid ${selectedTime === t ? primary : "var(--border)"}`,
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {dinnerTimes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--foreground-muted)" }}>
                        Jantar
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {dinnerTimes.map((t) => (
                          <button
                            key={t}
                            onClick={() => { setSelectedTime(t); setStep("pessoas"); }}
                            className="py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                            style={{
                              background: selectedTime === t ? primary : "var(--surface)",
                              color: selectedTime === t ? "white" : "var(--foreground)",
                              border: `2px solid ${selectedTime === t ? primary : "var(--border)"}`,
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: PESSOAS */}
              {step === "pessoas" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                      Quantas pessoas?
                    </h2>
                    <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                      {formatDateBR(selectedDate).dayName}, {formatDateBR(selectedDate).day} de {formatDateBR(selectedDate).month} às {selectedTime}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {partySizes.map((n) => (
                      <button
                        key={n}
                        onClick={() => setPartySize(n)}
                        className="flex flex-col items-center py-4 rounded-2xl transition-all active:scale-95"
                        style={{
                          background: partySize === n ? primary : "var(--surface)",
                          border: `2px solid ${partySize === n ? primary : "var(--border)"}`,
                        }}
                      >
                        <Users size={20} style={{ color: partySize === n ? "white" : "var(--foreground-muted)" }} />
                        <span
                          className="text-lg font-bold mt-1"
                          style={{ color: partySize === n ? "white" : "var(--foreground)" }}
                        >
                          {n}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
                    Para grupos maiores entre em contato: {restaurant.phone}
                  </p>

                  <button
                    onClick={() => setStep("dados")}
                    className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    style={{ background: primary }}
                  >
                    Continuar com {partySize} pessoa{partySize > 1 ? "s" : ""}
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {/* STEP: DADOS */}
              {step === "dados" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                      Seus dados
                    </h2>
                    <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                      Para confirmar sua reserva
                    </p>
                  </div>

                  {/* Resumo seleção */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl text-sm"
                    style={{ background: `${primary}15`, border: `1px solid ${primary}40` }}
                  >
                    <CalendarDays size={16} style={{ color: primary }} />
                    <span style={{ color: "var(--foreground)" }}>
                      {formatDateBR(selectedDate).dayName}, {formatDateBR(selectedDate).day} de {formatDateBR(selectedDate).month}
                    </span>
                    <span style={{ color: "var(--foreground-muted)" }}>·</span>
                    <Clock size={14} style={{ color: primary }} />
                    <span style={{ color: "var(--foreground)" }}>{selectedTime}</span>
                    <span style={{ color: "var(--foreground-muted)" }}>·</span>
                    <Users size={14} style={{ color: primary }} />
                    <span style={{ color: "var(--foreground)" }}>{partySize}p</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
                        Nome completo *
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
                        <input
                          type="text"
                          placeholder="Seu nome"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
                        WhatsApp / Telefone *
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
                        <input
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
                        Ocasião especial? <span className="normal-case font-normal">(opcional)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Aniversário 🎂", "Namoro 💑", "Negócios 💼", "Formatura 🎓", "Noivado 💍", "Outro"].map((oc) => (
                          <button
                            key={oc}
                            onClick={() => setOccasion(occasion === oc ? "" : oc)}
                            className="py-2 px-2 rounded-xl text-xs text-center transition-all"
                            style={{
                              background: occasion === oc ? `${primary}20` : "var(--surface)",
                              border: `1px solid ${occasion === oc ? primary : "var(--border)"}`,
                              color: occasion === oc ? primary : "var(--foreground-muted)",
                            }}
                          >
                            {oc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
                        Observações <span className="normal-case font-normal">(opcional)</span>
                      </label>
                      <div className="relative">
                        <MessageSquare size={16} className="absolute left-4 top-3.5" style={{ color: "var(--foreground-muted)" }} />
                        <textarea
                          rows={2}
                          placeholder="Alergias, cadeirinha, mesa específica..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none resize-none"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep("confirmar")}
                    disabled={!name || !phone}
                    className={cn(
                      "w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform",
                      (!name || !phone) && "opacity-40 cursor-not-allowed"
                    )}
                    style={{ background: primary }}
                  >
                    Revisar reserva
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {/* STEP: CONFIRMAR */}
              {step === "confirmar" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                      Confirmar reserva
                    </h2>
                    <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                      Revise os dados antes de confirmar
                    </p>
                  </div>

                  {/* Restaurant */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white flex-shrink-0"
                      style={{ background: primary }}
                    >
                      {restaurant.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--foreground)" }}>{restaurant.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{restaurant.address}</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div
                    className="rounded-2xl divide-y"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", borderColor: "var(--border)" }}
                  >
                    {[
                      { icon: CalendarDays, label: "Data", value: `${formatDateBR(selectedDate).dayName}, ${formatDateBR(selectedDate).day} de ${formatDateBR(selectedDate).month}` },
                      { icon: Clock, label: "Horário", value: selectedTime },
                      { icon: Users, label: "Pessoas", value: `${partySize} pessoa${partySize > 1 ? "s" : ""}` },
                      { icon: User, label: "Nome", value: name },
                      { icon: Phone, label: "Telefone", value: phone },
                      ...(occasion ? [{ icon: Sparkles, label: "Ocasião", value: occasion }] : []),
                      ...(notes ? [{ icon: MessageSquare, label: "Obs.", value: notes }] : []),
                    ].map(({ icon: Icon, label, value }, i) => (
                      <div key={label} className="flex items-center gap-3 px-4 py-3" style={{ borderColor: "var(--border)" }}>
                        <Icon size={16} style={{ color: primary }} />
                        <span className="text-sm flex-1" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                        <span className="text-sm font-medium text-right" style={{ color: "var(--foreground)" }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-center px-4" style={{ color: "var(--foreground-muted)" }}>
                    Ao confirmar, você receberá um lembrete no WhatsApp antes da reserva.
                  </p>

                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await fetch("/api/reservations", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            restaurantId: restaurant.id,
                            name,
                            phone,
                            date: selectedDate,
                            time: selectedTime,
                            partySize,
                            notes,
                            occasion,
                            origin: "WIDGET",
                          }),
                        });
                        if (!res.ok) throw new Error();
                        setStep("sucesso");
                      } catch {
                        alert("Erro ao confirmar reserva. Tente novamente.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg disabled:opacity-60"
                    style={{ background: "#22c55e" }}
                  >
                    {loading ? (
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <><Check size={20} /> Confirmar reserva</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* TELA DE SUCESSO */}
        {step === "sucesso" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg"
              style={{ background: "#22c55e20", border: "3px solid #22c55e" }}
            >
              <Check size={48} style={{ color: "#22c55e" }} />
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
              Reserva confirmada!
            </h2>
            <p className="text-base mb-6" style={{ color: "var(--foreground-muted)" }}>
              Te esperamos, {name.split(" ")[0]}!
            </p>

            <div
              className="w-full rounded-2xl divide-y mb-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {[
                { icon: CalendarDays, label: "Data", value: `${formatDateBR(selectedDate).dayName}, ${formatDateBR(selectedDate).day} de ${formatDateBR(selectedDate).month}` },
                { icon: Clock, label: "Horário", value: selectedTime },
                { icon: Users, label: "Pessoas", value: `${partySize} pessoa${partySize > 1 ? "s" : ""}` },
                { icon: MapPin, label: "Local", value: restaurant.address },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3" style={{ borderColor: "var(--border)" }}>
                  <Icon size={16} style={{ color: "#22c55e" }} />
                  <span className="text-sm flex-1 text-left" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                  <span className="text-sm font-medium text-right" style={{ color: "var(--foreground)" }}>{value}</span>
                </div>
              ))}
            </div>

            <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
              Um lembrete será enviado para <strong style={{ color: "var(--foreground)" }}>{phone}</strong> antes da reserva.
            </p>

            <button
              onClick={() => {
                setStep("inicio");
                setSelectedDate("");
                setSelectedTime("");
                setPartySize(2);
                setName("");
                setPhone("");
                setNotes("");
                setOccasion("");
              }}
              className="text-sm underline"
              style={{ color: "var(--foreground-muted)" }}
            >
              Fazer outra reserva
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
