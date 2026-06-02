"use client";

import { useState } from "react";
import { CalendarDays, Clock, Users, ChevronLeft, ChevronRight, Check, MapPin, Phone, User, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { cn, formatName } from "@/lib/utils";

interface Restaurant {
  id: string; slug: string; name: string; description: string;
  address: string; coverUrl: string | null; logoUrl: string | null;
  primaryColor: string; phone: string;
  availableSlots: { date: string; times: string[] }[];
}

type Step = "inicio" | "data" | "hora" | "pessoas" | "dados" | "confirmar" | "sucesso";

const partySizes = [1,2,3,4,5,6,7,8];
const dayNames   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const occasions  = ["Aniversário 🎂","Namoro 💑","Negócios 💼","Formatura 🎓","Noivado 💍","Outro"];

function fmtDate(s: string) {
  const [y,m,d] = s.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  return { day:d, dayName:dayNames[dt.getDay()], month:monthNames[m-1] };
}

// Light theme tokens
const C = {
  bg:    "#f4f4f5",
  sur:   "#ffffff",
  sur2:  "#fafafa",
  bdr:   "#e4e4e7",
  bdr2:  "#f0f0f2",
  fg:    "#18181b",
  muted: "#71717a",
  dim:   "#a1a1aa",
  gold:  "#c9a84c",
  goldL: "#fdf8ee",
  goldB: "#f0e8c8",
};

export default function WidgetClient({ restaurant }: { restaurant: Restaurant }) {
  const [step,         setStep]         = useState<Step>("inicio");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize,    setPartySize]    = useState(2);
  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [notes,        setNotes]        = useState("");
  const [occasion,     setOccasion]     = useState("");
  const [weekOffset,   setWeekOffset]   = useState(0);
  const [loading,      setLoading]      = useState(false);

  const today = new Date();
  const weekDays = Array.from({length:7},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()+weekOffset*7+i); return d.toISOString().split("T")[0]; });
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
      const res = await fetch("/api/reservations",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({restaurantId:restaurant.id,name,phone,date:selectedDate,time:selectedTime,partySize,notes,occasion,origin:"WIDGET"})});
      if (!res.ok) throw new Error();
      setStep("sucesso");
    } catch { alert("Erro ao confirmar. Tente novamente."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-start justify-center py-8 px-4" style={{background:C.bg}}>
      <div className="w-full max-w-lg">

        {/* ── INÍCIO ── */}
        {step==="inicio" && (
          <div className="overflow-hidden rounded-2xl border shadow-md" style={{background:C.sur,borderColor:C.bdr}}>
            <div className="px-8 pt-10 pb-8 text-center border-b" style={{borderColor:C.bdr,background:`linear-gradient(135deg,${C.goldL},${C.sur})`}}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow"
                style={{background:C.gold,color:"#fff"}}>
                {restaurant.name[0]}
              </div>
              <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{color:C.fg}}>{restaurant.name}</h1>
              <p className="text-sm leading-relaxed" style={{color:C.muted}}>{restaurant.description}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                {[{icon:MapPin,text:restaurant.address},{icon:Phone,text:restaurant.phone}].map(({icon:Icon,text})=>(
                  <div key={text} className="flex items-center gap-3 text-sm" style={{color:C.muted}}>
                    <Icon size={15} style={{color:C.gold,flexShrink:0}}/> {text}
                  </div>
                ))}
              </div>
              <button onClick={()=>setStep("data")}
                className="w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95 shadow-sm"
                style={{background:C.gold,color:"#fff"}}>
                <CalendarDays size={18}/> Reservar uma mesa <ArrowRight size={16}/>
              </button>
              <p className="text-xs text-center" style={{color:C.dim}}>Confirmação instantânea · Gratuito · Sem cadastro</p>
            </div>
          </div>
        )}

        {/* ── STEPS ── */}
        {step!=="inicio" && step!=="sucesso" && (
          <div className="rounded-2xl border overflow-hidden shadow-md" style={{background:C.sur,borderColor:C.bdr}}>
            {/* Top bar */}
            <div className="flex items-center gap-4 px-6 py-4 border-b" style={{borderColor:C.bdr}}>
              <button onClick={()=>setStep(stepOrder[stepIdx-1])}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 border"
                style={{borderColor:C.bdr,color:C.muted}}>
                <ChevronLeft size={16}/>
              </button>
              <div className="flex-1 flex items-center gap-2">
                {progSteps.map((ps,i)=>{
                  const stepName = ["data","hora","pessoas","dados","confirmar"][i] as Step;
                  const isCurrent = step===stepName;
                  const isDone = stepOrder.indexOf(step) > stepOrder.indexOf(stepName);
                  return (
                    <div key={ps} className="flex-1 flex flex-col gap-1.5">
                      <div className="h-0.5 rounded-full transition-all"
                        style={{background:isDone||isCurrent ? C.gold : C.bdr,opacity:isDone?0.5:1}}/>
                      <span className="text-xs font-medium" style={{color:isCurrent ? C.gold : C.dim}}>{ps}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-8">
              {/* ── DATA ── */}
              {step==="data" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>Qual data?</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>Selecione o dia da sua visita</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <button onClick={()=>setWeekOffset(w=>Math.max(0,w-1))} disabled={weekOffset===0}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border disabled:opacity-30 hover:bg-gray-50"
                      style={{borderColor:C.bdr,color:C.muted}}>
                      <ChevronLeft size={16}/>
                    </button>
                    <span className="text-sm font-medium" style={{color:C.muted}}>
                      {weekOffset===0?"Esta semana":`Próxima semana +${weekOffset}`}
                    </span>
                    <button onClick={()=>setWeekOffset(w=>w+1)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border hover:bg-gray-50"
                      style={{borderColor:C.bdr,color:C.muted}}>
                      <ChevronRight size={16}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(dateStr=>{
                      const fmt=fmtDate(dateStr);
                      const hasSlots=availMap.has(dateStr);
                      const isPast=new Date(dateStr)<new Date(today.toISOString().split("T")[0]);
                      const isSel=selectedDate===dateStr;
                      return (
                        <button key={dateStr} disabled={!hasSlots||isPast}
                          onClick={()=>{setSelectedDate(dateStr);setSelectedTime("");setStep("hora");}}
                          className="flex flex-col items-center py-3.5 rounded-xl transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-95 border"
                          style={{background:isSel?C.gold:C.sur,borderColor:isSel?C.gold:C.bdr}}>
                          <span className="text-xs mb-1" style={{color:isSel?"#fff":C.dim}}>{fmt.dayName}</span>
                          <span className="text-lg font-bold" style={{color:isSel?"#fff":C.fg}}>{fmt.day}</span>
                          {hasSlots&&!isPast&&<div className="w-1 h-1 rounded-full mt-1.5" style={{background:isSel?"#fff":C.gold}}/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── HORA ── */}
              {step==="hora" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>Que horas?</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>
                      {fmtDate(selectedDate).dayName}, {fmtDate(selectedDate).day} de {fmtDate(selectedDate).month}
                    </p>
                  </div>
                  {lunchTimes.length>0&&(
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:C.dim}}>Almoço</p>
                      <div className="grid grid-cols-4 gap-2">
                        {lunchTimes.map(t=>(
                          <button key={t} onClick={()=>{setSelectedTime(t);setStep("pessoas");}}
                            className="py-3.5 rounded-xl text-sm font-semibold border transition-all active:scale-95"
                            style={{background:selectedTime===t?C.gold:C.sur2,color:selectedTime===t?"#fff":C.fg,borderColor:selectedTime===t?C.gold:C.bdr}}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {dinnerTimes.length>0&&(
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:C.dim}}>Jantar</p>
                      <div className="grid grid-cols-4 gap-2">
                        {dinnerTimes.map(t=>(
                          <button key={t} onClick={()=>{setSelectedTime(t);setStep("pessoas");}}
                            className="py-3.5 rounded-xl text-sm font-semibold border transition-all active:scale-95"
                            style={{background:selectedTime===t?C.gold:C.sur2,color:selectedTime===t?"#fff":C.fg,borderColor:selectedTime===t?C.gold:C.bdr}}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── PESSOAS ── */}
              {step==="pessoas" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>Quantas pessoas?</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>
                      {fmtDate(selectedDate).dayName}, {fmtDate(selectedDate).day} de {fmtDate(selectedDate).month} às {selectedTime}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {partySizes.map(n=>(
                      <button key={n} onClick={()=>setPartySize(n)}
                        className="flex flex-col items-center py-5 rounded-xl border transition-all active:scale-95"
                        style={{background:partySize===n?C.gold:C.sur2,borderColor:partySize===n?C.gold:C.bdr}}>
                        <Users size={18} style={{color:partySize===n?"#fff":C.dim,marginBottom:"6px"}}/>
                        <span className="text-xl font-bold" style={{color:partySize===n?"#fff":C.fg}}>{n}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-center" style={{color:C.dim}}>Grupos maiores: {restaurant.phone}</p>
                  <button onClick={()=>setStep("dados")}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:opacity-90"
                    style={{background:C.gold,color:"#fff"}}>
                    Continuar com {partySize} {partySize===1?"pessoa":"pessoas"} <ArrowRight size={16}/>
                  </button>
                </div>
              )}

              {/* ── DADOS ── */}
              {step==="dados" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>Seus dados</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>Para confirmar sua reserva</p>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm border"
                    style={{background:C.goldL,borderColor:C.goldB}}>
                    <CalendarDays size={14} style={{color:C.gold}}/><span style={{color:C.fg}}>{fmtDate(selectedDate).dayName}, {fmtDate(selectedDate).day} de {fmtDate(selectedDate).month}</span>
                    <span style={{color:C.dim}}>·</span><Clock size={14} style={{color:C.gold}}/><span style={{color:C.fg}}>{selectedTime}</span>
                    <span style={{color:C.dim}}>·</span><Users size={14} style={{color:C.gold}}/><span style={{color:C.fg}}>{partySize}p</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      {label:"Nome completo *",placeholder:"Seu nome",value:name,onChange:(v:string)=>setName(formatName(v)),icon:User,type:"text"},
                      {label:"WhatsApp / Telefone *",placeholder:"(11) 99999-9999",value:phone,onChange:(v:string)=>setPhone(v),icon:Phone,type:"tel"},
                    ].map(f=>(
                      <div key={f.label}>
                        <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{color:C.muted}}>{f.label}</label>
                        <div className="relative">
                          <f.icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{color:C.dim}}/>
                          <input type={f.type} placeholder={f.placeholder} value={f.value}
                            onChange={e=>f.onChange(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 text-sm" style={{fontSize:"15px"}}/>
                        </div>
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{color:C.muted}}>
                        Ocasião especial <span className="normal-case font-normal">(opcional)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {occasions.map(oc=>(
                          <button key={oc} onClick={()=>setOccasion(occasion===oc?"":oc)}
                            className="py-2.5 px-2 rounded-lg text-xs text-center border transition-all"
                            style={{background:occasion===oc?C.goldL:C.sur2,borderColor:occasion===oc?C.gold:C.bdr,color:occasion===oc?C.gold:C.muted}}>
                            {oc}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{color:C.muted}}>
                        Observações <span className="normal-case font-normal">(opcional)</span>
                      </label>
                      <div className="relative">
                        <MessageSquare size={15} className="absolute left-4 top-4" style={{color:C.dim}}/>
                        <textarea rows={2} placeholder="Alergias, preferências, cadeirinha..."
                          value={notes} onChange={e=>setNotes(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 text-sm resize-none" style={{fontSize:"15px"}}/>
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>setStep("confirmar")} disabled={!name||!phone}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm transition-all hover:opacity-90"
                    style={{background:C.gold,color:"#fff"}}>
                    Revisar reserva <ArrowRight size={16}/>
                  </button>
                </div>
              )}

              {/* ── CONFIRMAR ── */}
              {step==="confirmar" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>Confirmar reserva</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>Revise os dados antes de confirmar</p>
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-xl border" style={{background:C.goldL,borderColor:C.goldB}}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                      style={{background:C.gold,color:"#fff"}}>{restaurant.name[0]}</div>
                    <div>
                      <p className="font-semibold" style={{color:C.fg}}>{restaurant.name}</p>
                      <p className="text-xs mt-0.5" style={{color:C.muted}}>{restaurant.address}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border overflow-hidden divide-y" style={{borderColor:C.bdr}}>
                    {[
                      {icon:CalendarDays,label:"Data",value:`${fmtDate(selectedDate).dayName}, ${fmtDate(selectedDate).day} de ${fmtDate(selectedDate).month}`},
                      {icon:Clock,label:"Horário",value:selectedTime},
                      {icon:Users,label:"Pessoas",value:`${partySize} pessoa${partySize>1?"s":""}`},
                      {icon:User,label:"Nome",value:name},
                      {icon:Phone,label:"Telefone",value:phone},
                      ...(occasion?[{icon:Sparkles,label:"Ocasião",value:occasion}]:[]),
                      ...(notes?[{icon:MessageSquare,label:"Obs.",value:notes}]:[]),
                    ].map(({icon:Icon,label,value})=>(
                      <div key={label} className="flex items-center gap-4 px-5 py-3.5" style={{borderColor:C.bdr2}}>
                        <Icon size={15} style={{color:C.gold,flexShrink:0}}/>
                        <span className="text-sm flex-1" style={{color:C.muted}}>{label}</span>
                        <span className="text-sm font-medium text-right" style={{color:C.fg}}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center" style={{color:C.dim}}>Você receberá uma confirmação no WhatsApp.</p>
                  <button onClick={handleConfirm} disabled={loading}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                    style={{background:"#16a34a",color:"#fff"}}>
                    {loading?<span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/>
                            :<><Check size={18}/> Confirmar Reserva</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUCESSO ── */}
        {step==="sucesso" && (
          <div className="rounded-2xl border overflow-hidden shadow-md" style={{background:C.sur,borderColor:C.bdr}}>
            <div className="px-8 py-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4"
                style={{background:"#f0fdf4",borderColor:"#86efac"}}>
                <Check size={36} style={{color:"#16a34a"}}/>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{color:C.fg}}>Reserva confirmada!</h2>
                <p className="text-base" style={{color:C.muted}}>Te esperamos, {name.split(" ")[0]}!</p>
              </div>
              <div className="rounded-xl border overflow-hidden divide-y text-left" style={{borderColor:C.bdr}}>
                {[
                  {icon:CalendarDays,label:"Data",value:`${fmtDate(selectedDate).dayName}, ${fmtDate(selectedDate).day} de ${fmtDate(selectedDate).month}`},
                  {icon:Clock,label:"Horário",value:selectedTime},
                  {icon:Users,label:"Pessoas",value:`${partySize} pessoa${partySize>1?"s":""}`},
                  {icon:MapPin,label:"Local",value:restaurant.address},
                ].map(({icon:Icon,label,value})=>(
                  <div key={label} className="flex items-center gap-4 px-5 py-4" style={{borderColor:C.bdr2}}>
                    <Icon size={15} style={{color:"#16a34a",flexShrink:0}}/>
                    <span className="text-sm flex-1" style={{color:C.muted}}>{label}</span>
                    <span className="text-sm font-medium text-right" style={{color:C.fg}}>{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{color:C.dim}}>
                Confirmação enviada para <strong style={{color:C.muted}}>{phone}</strong>
              </p>
              <button onClick={()=>{setStep("inicio");setSelectedDate("");setSelectedTime("");setPartySize(2);setName("");setPhone("");setNotes("");setOccasion("");}}
                className="text-sm underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{color:C.dim}}>
                Fazer outra reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
