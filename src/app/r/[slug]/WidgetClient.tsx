"use client";

import { useState } from "react";
import { CalendarDays, Clock, Users, ChevronLeft, ChevronRight, Check, MapPin, Phone, User, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
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
const dayNames   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const occasions  = ["Aniversário 🎂","Namoro 💑","Negócios 💼","Formatura 🎓","Noivado 💍","Outro"];

function fmtDate(s: string) {
  const [y,m,d] = s.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return { day:d, dayName:dayNames[dt.getDay()], month:monthNames[m-1], full:`${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}` };
}

export default function WidgetClient({ restaurant }: { restaurant: Restaurant }) {
  const p = "#c9a84c"; // gold accent
  const [step,          setStep]          = useState<Step>("inicio");
  const [selectedDate,  setSelectedDate]  = useState("");
  const [selectedTime,  setSelectedTime]  = useState("");
  const [partySize,     setPartySize]     = useState(2);
  const [name,          setName]          = useState("");
  const [phone,         setPhone]         = useState("");
  const [notes,         setNotes]         = useState("");
  const [occasion,      setOccasion]      = useState("");
  const [weekOffset,    setWeekOffset]    = useState(0);
  const [loading,       setLoading]       = useState(false);

  const today = new Date();
  const weekDays = Array.from({length:7},(_,i) => {
    const d = new Date(today); d.setDate(today.getDate() + weekOffset*7 + i);
    return d.toISOString().split("T")[0];
  });
  const availMap   = new Map(restaurant.availableSlots.map(s=>[s.date,s.times]));
  const timesForDate = selectedDate ? (availMap.get(selectedDate)||[]) : [];
  const lunchTimes  = timesForDate.filter(t=>parseInt(t)<17);
  const dinnerTimes = timesForDate.filter(t=>parseInt(t)>=17);

  const stepOrder: Step[] = ["inicio","data","hora","pessoas","dados","confirmar","sucesso"];
  const stepIdx = stepOrder.indexOf(step);
  const progSteps = ["Data","Hora","Pessoas","Dados"];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id, name, phone, date: selectedDate, time: selectedTime, partySize, notes, occasion, origin: "WIDGET" }),
      });
      if (!res.ok) throw new Error();
      setStep("sucesso");
    } catch { alert("Erro ao confirmar. Tente novamente."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-8 px-4" style={{ background: "#09090b" }}>
      <div className="w-full max-w-lg">

        {/* ── INÍCIO ── */}
        {step === "inicio" && (
          <div className="overflow-hidden rounded-2xl border" style={{ background: "#111113", borderColor: "#27272a" }}>
            {/* Hero */}
            <div className="px-8 pt-10 pb-8 text-center border-b" style={{ borderColor: "#1f1f23", background: "linear-gradient(135deg,#1a1508,#111113)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg"
                style={{ background: p, color: "#09090b" }}>
                {restaurant.name[0]}
              </div>
              <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: "#fafafa" }}>{restaurant.name}</h1>
              <p className="text-sm leading-relaxed" style={{ color: "#71717a" }}>{restaurant.description}</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Info */}
              <div className="space-y-3">
                {[
                  { icon: MapPin, text: restaurant.address },
                  { icon: Phone, text: restaurant.phone },
                ].map(({icon:Icon, text}) => (
                  <div key={text} className="flex items-center gap-3 text-sm" style={{ color: "#71717a" }}>
                    <Icon size={15} style={{ color: p, flexShrink: 0 }} />
                    {text}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button onClick={() => setStep("data")}
                className="w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-opacity hover:opacity-90 active:scale-95"
                style={{ background: p, color: "#09090b" }}>
                <CalendarDays size={18} />
                Reservar uma mesa
                <ArrowRight size={16} />
              </button>
              <p className="text-xs text-center" style={{ color: "#3f3f46" }}>
                Confirmação instantânea · Gratuito · Sem cadastro
              </p>
            </div>
          </div>
        )}

        {/* ── STEPS ── */}
        {step !== "inicio" && step !== "sucesso" && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: "#111113", borderColor: "#27272a" }}>
            {/* Top bar */}
            <div className="flex items-center gap-4 px-6 py-4 border-b" style={{ borderColor: "#1f1f23" }}>
              <button onClick={() => setStep(stepOrder[stepIdx-1])}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-60"
                style={{ background: "#18181b", color: "#71717a" }}>
                <ChevronLeft size={16} />
              </button>
              {/* Progress */}
              <div className="flex-1 flex items-center gap-2">
                {progSteps.map((ps,i) => {
                  const cur = progSteps.indexOf(progSteps.find((_,j) => stepOrder[j+1] === step) ?? "") ;
                  const psIdx = i;
                  const stepName = ["data","hora","pessoas","dados","confirmar"][i];
                  const isCurrent = step === stepName;
                  const isDone = stepOrder.indexOf(step) > stepOrder.indexOf(stepName as Step);
                  return (
                    <div key={ps} className="flex-1 flex flex-col gap-1.5">
                      <div className="h-0.5 rounded-full transition-all"
                        style={{ background: isDone||isCurrent ? p : "#27272a", opacity: isDone ? 0.5 : 1 }} />
                      <span className="text-xs" style={{ color: isCurrent ? p : "#3f3f46" }}>{ps}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-8">

              {/* ── DATA ── */}
              {step === "data" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: "#fafafa" }}>Qual data?</h2>
                    <p className="text-sm mt-1" style={{ color: "#71717a" }}>Selecione o dia da sua visita</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setWeekOffset(w=>Math.max(0,w-1))} disabled={weekOffset===0}
                      className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-20"
                      style={{ background: "#18181b", color: "#71717a" }}>
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium" style={{ color: "#71717a" }}>
                      {weekOffset===0 ? "Esta semana" : `Próxima semana +${weekOffset}`}
                    </span>
                    <button onClick={() => setWeekOffset(w=>w+1)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: "#18181b", color: "#71717a" }}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(dateStr => {
                      const fmt = fmtDate(dateStr);
                      const hasSlots = availMap.has(dateStr);
                      const isPast = new Date(dateStr) < new Date(today.toISOString().split("T")[0]);
                      const isSel = selectedDate === dateStr;
                      return (
                        <button key={dateStr} disabled={!hasSlots||isPast}
                          onClick={() => { setSelectedDate(dateStr); setSelectedTime(""); setStep("hora"); }}
                          className="flex flex-col items-center py-3.5 rounded-xl transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
                          style={{ background: isSel ? p : "#18181b", border: `1px solid ${isSel ? p : "#27272a"}` }}>
                          <span className="text-xs mb-1" style={{ color: isSel ? "#09090b" : "#52525b" }}>{fmt.dayName}</span>
                          <span className="text-lg font-bold" style={{ color: isSel ? "#09090b" : "#fafafa" }}>{fmt.day}</span>
                          {hasSlots && !isPast && (
                            <div className="w-1 h-1 rounded-full mt-1.5" style={{ background: isSel ? "#09090b" : p }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── HORA ── */}
              {step === "hora" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: "#fafafa" }}>Que horas?</h2>
                    <p className="text-sm mt-1" style={{ color: "#71717a" }}>
                      {fmtDate(selectedDate).dayName}, {fmtDate(selectedDate).day} de {fmtDate(selectedDate).month}
                    </p>
                  </div>
                  {lunchTimes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>Almoço</p>
                      <div className="grid grid-cols-4 gap-2">
                        {lunchTimes.map(t => (
                          <button key={t} onClick={() => { setSelectedTime(t); setStep("pessoas"); }}
                            className="py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                            style={{ background: selectedTime===t ? p : "#18181b", color: selectedTime===t ? "#09090b" : "#a1a1aa", border: `1px solid ${selectedTime===t ? p : "#27272a"}` }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {dinnerTimes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#52525b" }}>Jantar</p>
                      <div className="grid grid-cols-4 gap-2">
                        {dinnerTimes.map(t => (
                          <button key={t} onClick={() => { setSelectedTime(t); setStep("pessoas"); }}
                            className="py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                            style={{ background: selectedTime===t ? p : "#18181b", color: selectedTime===t ? "#09090b" : "#a1a1aa", border: `1px solid ${selectedTime===t ? p : "#27272a"}` }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── PESSOAS ── */}
              {step === "pessoas" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: "#fafafa" }}>Quantas pessoas?</h2>
                    <p className="text-sm mt-1" style={{ color: "#71717a" }}>
                      {fmtDate(selectedDate).dayName}, {fmtDate(selectedDate).day} de {fmtDate(selectedDate).month} às {selectedTime}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {partySizes.map(n => (
                      <button key={n} onClick={() => setPartySize(n)}
                        className="flex flex-col items-center py-5 rounded-xl transition-all active:scale-95"
                        style={{ background: partySize===n ? p : "#18181b", border: `1px solid ${partySize===n ? p : "#27272a"}` }}>
                        <Users size={18} style={{ color: partySize===n ? "#09090b" : "#52525b", marginBottom: "6px" }} />
                        <span className="text-xl font-bold" style={{ color: partySize===n ? "#09090b" : "#fafafa" }}>{n}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-center" style={{ color: "#3f3f46" }}>
                    Grupos maiores: {restaurant.phone}
                  </p>
                  <button onClick={() => setStep("dados")}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ background: p, color: "#09090b" }}>
                    Continuar com {partySize} {partySize===1?"pessoa":"pessoas"} <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* ── DADOS ── */}
              {step === "dados" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: "#fafafa" }}>Seus dados</h2>
                    <p className="text-sm mt-1" style={{ color: "#71717a" }}>Para confirmar sua reserva</p>
                  </div>

                  {/* Summary chip */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "#1a1508", border: `1px solid ${p}30` }}>
                    <CalendarDays size={14} style={{ color: p }} />
                    <span style={{ color: "#fafafa" }}>{fmtDate(selectedDate).dayName}, {fmtDate(selectedDate).day} de {fmtDate(selectedDate).month}</span>
                    <span style={{ color: "#52525b" }}>·</span>
                    <Clock size={14} style={{ color: p }} />
                    <span style={{ color: "#fafafa" }}>{selectedTime}</span>
                    <span style={{ color: "#52525b" }}>·</span>
                    <Users size={14} style={{ color: p }} />
                    <span style={{ color: "#fafafa" }}>{partySize}p</span>
                  </div>

                  {/* Fields */}
                  <div className="space-y-4">
                    {[
                      { label:"Nome completo *", placeholder:"Seu nome", value:name, onChange:(v:string)=>setName(v), icon:User, type:"text" },
                      { label:"WhatsApp / Telefone *", placeholder:"(11) 99999-9999", value:phone, onChange:(v:string)=>setPhone(v), icon:Phone, type:"tel" },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: "#52525b" }}>{f.label}</label>
                        <div className="relative">
                          <f.icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
                          <input type={f.type} placeholder={f.placeholder} value={f.value}
                            onChange={e=>f.onChange(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 text-sm"
                            style={{ background: "#18181b", borderColor: "#27272a", borderRadius: "10px", fontSize:"15px" }}
                          />
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: "#52525b" }}>
                        Ocasião especial <span className="normal-case font-normal">(opcional)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {occasions.map(oc => (
                          <button key={oc} onClick={() => setOccasion(occasion===oc?"":oc)}
                            className="py-2.5 px-2 rounded-lg text-xs text-center transition-all"
                            style={{ background: occasion===oc ? "#1a1508" : "#18181b", border: `1px solid ${occasion===oc ? p : "#27272a"}`, color: occasion===oc ? p : "#52525b" }}>
                            {oc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: "#52525b" }}>
                        Observações <span className="normal-case font-normal">(opcional)</span>
                      </label>
                      <div className="relative">
                        <MessageSquare size={15} className="absolute left-4 top-4" style={{ color: "#52525b" }} />
                        <textarea rows={2} placeholder="Alergias, preferências, cadeirinha..."
                          value={notes} onChange={e=>setNotes(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 text-sm resize-none"
                          style={{ background: "#18181b", borderColor: "#27272a", borderRadius: "10px", fontSize:"15px" }}
                        />
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setStep("confirmar")} disabled={!name||!phone}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity hover:opacity-90"
                    style={{ background: p, color: "#09090b" }}>
                    Revisar reserva <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* ── CONFIRMAR ── */}
              {step === "confirmar" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: "#fafafa" }}>Confirmar reserva</h2>
                    <p className="text-sm mt-1" style={{ color: "#71717a" }}>Revise os dados antes de confirmar</p>
                  </div>

                  <div className="flex items-center gap-4 p-5 rounded-xl border"
                    style={{ background: "#18181b", borderColor: "#27272a" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                      style={{ background: p, color: "#09090b" }}>{restaurant.name[0]}</div>
                    <div>
                      <p className="font-semibold" style={{ color: "#fafafa" }}>{restaurant.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#71717a" }}>{restaurant.address}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border overflow-hidden divide-y" style={{ borderColor: "#27272a" }}>
                    {[
                      { icon: CalendarDays, label: "Data",     value: `${fmtDate(selectedDate).dayName}, ${fmtDate(selectedDate).day} de ${fmtDate(selectedDate).month}` },
                      { icon: Clock,        label: "Horário",  value: selectedTime },
                      { icon: Users,        label: "Pessoas",  value: `${partySize} pessoa${partySize>1?"s":""}` },
                      { icon: User,         label: "Nome",     value: name },
                      { icon: Phone,        label: "Telefone", value: phone },
                      ...(occasion ? [{ icon: Sparkles, label: "Ocasião", value: occasion }] : []),
                      ...(notes    ? [{ icon: MessageSquare, label: "Obs.", value: notes }] : []),
                    ].map(({icon:Icon,label,value}) => (
                      <div key={label} className="flex items-center gap-4 px-5 py-3.5" style={{ background: "#18181b", borderColor: "#1f1f23" }}>
                        <Icon size={15} style={{ color: p, flexShrink:0 }} />
                        <span className="text-sm flex-1" style={{ color: "#71717a" }}>{label}</span>
                        <span className="text-sm font-medium text-right" style={{ color: "#fafafa" }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-center" style={{ color: "#3f3f46" }}>
                    Você receberá uma confirmação no WhatsApp.
                  </p>

                  <button onClick={handleConfirm} disabled={loading}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: "#166534", color: "#4ade80", border: "1px solid #166534" }}>
                    {loading ? <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                              : <><Check size={18} /> Confirmar Reserva</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUCESSO ── */}
        {step === "sucesso" && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: "#111113", borderColor: "#27272a" }}>
            <div className="px-8 py-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "#052e16", border: "2px solid #166534" }}>
                <Check size={36} style={{ color: "#4ade80" }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "#fafafa" }}>Reserva confirmada!</h2>
                <p className="text-base" style={{ color: "#71717a" }}>Te esperamos, {name.split(" ")[0]}!</p>
              </div>
              <div className="rounded-xl border overflow-hidden divide-y text-left" style={{ borderColor: "#1f1f23" }}>
                {[
                  { icon: CalendarDays, label:"Data",    value:`${fmtDate(selectedDate).dayName}, ${fmtDate(selectedDate).day} de ${fmtDate(selectedDate).month}` },
                  { icon: Clock,        label:"Horário", value:selectedTime },
                  { icon: Users,        label:"Pessoas", value:`${partySize} pessoa${partySize>1?"s":""}` },
                  { icon: MapPin,       label:"Local",   value:restaurant.address },
                ].map(({icon:Icon,label,value}) => (
                  <div key={label} className="flex items-center gap-4 px-5 py-4" style={{ background:"#18181b", borderColor:"#1f1f23" }}>
                    <Icon size={15} style={{ color:"#4ade80", flexShrink:0 }} />
                    <span className="text-sm flex-1" style={{ color:"#71717a" }}>{label}</span>
                    <span className="text-sm font-medium text-right" style={{ color:"#fafafa" }}>{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color:"#52525b" }}>
                Confirmação enviada para <strong style={{ color:"#a1a1aa" }}>{phone}</strong>
              </p>
              <button onClick={() => { setStep("inicio"); setSelectedDate(""); setSelectedTime(""); setPartySize(2); setName(""); setPhone(""); setNotes(""); setOccasion(""); }}
                className="text-sm underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color:"#52525b" }}>
                Fazer outra reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
