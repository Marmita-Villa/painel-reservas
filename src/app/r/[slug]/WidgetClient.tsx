"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Clock, Users, ChevronLeft, ChevronRight, Check, MapPin, Phone, User, MessageSquare, Sparkles, ArrowRight, UtensilsCrossed } from "lucide-react";
import { cn, formatName } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import LangToggle from "@/components/LangToggle";

interface Restaurant {
  id: string; slug: string; name: string; description: string;
  address: string; coverUrl: string | null; logoUrl: string | null;
  primaryColor: string; phone: string; email?: string; totalSlots?: number;
  availableSlots: { date: string; times: string[] }[];
}

type Step = "inicio" | "data" | "hora" | "pessoas" | "dados" | "confirmar" | "sucesso";

const partySizes = [1,2,3,4,5,6,7,8];
const dayNamesPt = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const dayNamesEn = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const monthNamesPt = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const monthNamesEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmtDate(s: string, lang: "pt"|"en" = "pt") {
  const [y,m,d] = s.split("-").map(Number);
  const dt = new Date(y,m-1,d);
  const dayNames = lang === "en" ? dayNamesEn : dayNamesPt;
  const monthNames = lang === "en" ? monthNamesEn : monthNamesPt;
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
  gold:  "#f07316",
  goldL: "#fff7ed",
  goldB: "#fed7aa",
};

export default function WidgetClient({ restaurant }: { restaurant: Restaurant }) {
  const { lang, setLang, t } = useTranslation();
  const occasions = [t("birthday"), t("romance"), t("business"), t("graduation"), t("engagement"), t("other")];
  const dayNames  = lang === "en" ? dayNamesEn : dayNamesPt;
  const [step,         setStep]         = useState<Step>("inicio");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize,    setPartySize]    = useState(2);
  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [notes,        setNotes]        = useState("");
  const [occasion,     setOccasion]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [loggedIn,     setLoggedIn]     = useState(false);
  // Use fixed initial date to avoid SSR/client mismatch — updated after mount
  const [calMonth,     setCalMonth]     = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [now,          setNow]          = useState<Date | null>(null);

  // Only run date logic on client to avoid hydration mismatch
  useEffect(() => { setNow(new Date()); }, []);

  // Pre-fill fields if customer is already logged in on the portal
  useEffect(() => {
    fetch("/api/cliente/perfil")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.name) { setName(data.name); setLoggedIn(true); }
        if (data?.phone) setPhone(data.phone);
      })
      .catch(() => {});
  }, []);

  const today      = now ?? new Date(0); // epoch as safe SSR default
  const todayStr   = now ? now.toISOString().split("T")[0] : "9999-12-31"; // future date = no filtering on SSR
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() + 60 : 0;

  // Build availMap filtering out past times for today
  const availMap = new Map(
    restaurant.availableSlots
      .map(s => {
        if (s.date !== todayStr) return [s.date, s.times] as [string, string[]];
        const futureTimes = s.times.filter(t => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m > nowMinutes;
        });
        return futureTimes.length > 0 ? [s.date, futureTimes] as [string, string[]] : null;
      })
      .filter(Boolean) as [string, string[]][]
  );

  // Calendar grid: 6 weeks starting from first day of calMonth
  const calDays = (() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const cells: (string|null)[] = [];
    for (let i=0; i<firstDay; i++) cells.push(null);
    for (let d=1; d<=daysInMonth; d++) {
      cells.push(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  })();

  const maxMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()+2); return d; })();

  // Filter out past times when selected date is today (with 60min buffer)
  const allTimesForDate = selectedDate ? (availMap.get(selectedDate)||[]) : [];
  const timesForDate = allTimesForDate.filter(t => {
    if (selectedDate !== todayStr) return true;
    const [h, m] = t.split(":").map(Number);
    const slotMs = h * 60 + m;
    const nowMs  = today.getHours() * 60 + today.getMinutes() + 60; // 60min antecedência
    return slotMs > nowMs;
  });
  const lunchTimes  = timesForDate.filter(t=>parseInt(t)<17);
  const dinnerTimes = timesForDate.filter(t=>parseInt(t)>=17);

  const stepOrder: Step[] = ["inicio","data","hora","pessoas","dados","confirmar","sucesso"];
  const stepIdx = stepOrder.indexOf(step);
  const progSteps = lang === "en"
    ? ["Date","Time","Guests","Details"]
    : ["Data","Hora","Pessoas","Dados"];

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
            {/* Hero */}
            <div className="relative px-8 pt-10 pb-8 text-center border-b" style={{borderColor:C.bdr,background:`linear-gradient(135deg,${C.goldL} 0%,${C.sur} 60%)`}}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-5 shadow-lg"
                style={{background:C.gold,color:"#fff"}}>
                {restaurant.logoUrl
                  ? <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover rounded-2xl" />
                  : restaurant.name[0]}
              </div>
              <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{color:C.fg}}>{restaurant.name}</h1>
              <p className="text-sm leading-relaxed" style={{color:C.muted}}>{restaurant.description}</p>

              {/* Stats strip */}
              {(restaurant.totalSlots ?? 0) > 0 && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{background:C.goldB,color:"#92400e"}}>
                    <CalendarDays size={11}/> {restaurant.availableSlots.length} {t("daysAvailable")}
                  </span>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <LangToggle lang={lang} setLang={setLang} />
              </div>
            </div>

            <div className="p-7 space-y-5">
              {/* Info */}
              <div className="space-y-2.5">
                {restaurant.address && (
                  <div className="flex items-start gap-3 text-sm" style={{color:C.muted}}>
                    <MapPin size={14} style={{color:C.gold,flexShrink:0,marginTop:2}}/> {restaurant.address}
                  </div>
                )}
                {restaurant.phone && (
                  <div className="flex items-center gap-3 text-sm" style={{color:C.muted}}>
                    <Phone size={14} style={{color:C.gold,flexShrink:0}}/> {restaurant.phone}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-2 py-1">
                {[
                  {label:t("instantConfirmation"), sub:t("instantConfirmationSub")},
                  {label:t("free"),                sub:t("freeSub")},
                  {label:t("noSignup"),            sub:t("noSignupSub")},
                ].map(f=>(
                  <div key={f.label} className="text-center py-3 px-2 rounded-xl border"
                    style={{background:C.sur2,borderColor:C.bdr2}}>
                    <p className="text-xs font-semibold leading-tight" style={{color:C.fg}}>{f.label}</p>
                    <p className="text-xs leading-tight mt-0.5" style={{color:C.dim}}>{f.sub}</p>
                  </div>
                ))}
              </div>

              <button onClick={()=>setStep("data")}
                className="w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95 shadow-sm"
                style={{background:C.gold,color:"#fff"}}>
                <CalendarDays size={18}/> {t("reserveTable")} <ArrowRight size={16}/>
              </button>
              <a href={`/r/${restaurant.slug}/cardapio`}
                className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-all hover:opacity-80"
                style={{borderColor:C.bdr,color:C.muted,background:C.sur2}}>
                <UtensilsCrossed size={15}/> {t("viewMenu")}
              </a>
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
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>{t("whichDate")}</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>{t("selectDay")}</p>
                  </div>

                  {/* Month navigation */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))}
                      disabled={calMonth.getFullYear()===today.getFullYear()&&calMonth.getMonth()===today.getMonth()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:bg-gray-50 disabled:opacity-30"
                      style={{borderColor:C.bdr,color:C.muted}}>
                      <ChevronLeft size={16}/>
                    </button>
                    <span className="text-sm font-semibold" style={{color:C.fg}}>
                      {(lang==="en"?monthNamesEn:monthNamesPt)[calMonth.getMonth()]} {calMonth.getFullYear()}
                    </span>
                    <button
                      onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))}
                      disabled={calMonth>=maxMonth}
                      className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:bg-gray-50 disabled:opacity-30"
                      style={{borderColor:C.bdr,color:C.muted}}>
                      <ChevronRight size={16}/>
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1">
                    {dayNames.map(d=>(
                      <div key={d} className="text-center text-xs font-semibold py-1" style={{color:C.dim}}>{d}</div>
                    ))}

                    {/* Calendar cells */}
                    {calDays.map((dateStr,i)=>{
                      if (!dateStr) return <div key={`empty-${i}`}/>;
                      const hasSlots = availMap.has(dateStr);
                      const slotCount = availMap.get(dateStr)?.length ?? 0;
                      const isPast = dateStr < todayStr;
                      const isToday = dateStr === todayStr;
                      const isSel = selectedDate === dateStr;
                      const isDisabled = isPast || !hasSlots;
                      // availability: many slots = green dot, few (<=2) = amber, none = no dot
                      const dotColor = slotCount > 2 ? "#16a34a" : slotCount > 0 ? C.gold : "transparent";

                      return (
                        <button key={dateStr}
                          disabled={isDisabled}
                          onClick={()=>{setSelectedDate(dateStr);setSelectedTime("");setStep("hora");}}
                          className="relative flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 disabled:cursor-not-allowed"
                          style={{
                            height:"52px",
                            background: isSel ? C.gold : isToday ? C.goldL : "transparent",
                            border: isToday && !isSel ? `2px solid ${C.gold}` : isSel ? `2px solid ${C.gold}` : "2px solid transparent",
                            opacity: isDisabled ? 0.25 : 1,
                          }}>
                          <span className="text-sm font-semibold leading-none" style={{color:isSel?"#fff":C.fg}}>
                            {parseInt(dateStr.split("-")[2])}
                          </span>
                          {/* Availability dot */}
                          {!isPast && (
                            <div className="w-1.5 h-1.5 rounded-full mt-1"
                              style={{background:isSel?"rgba(255,255,255,0.8)":dotColor}}/>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{background:"#16a34a"}}/>
                      <span className="text-xs" style={{color:C.muted}}>{t("available")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{background:C.gold}}/>
                      <span className="text-xs" style={{color:C.muted}}>{t("fewSlots")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── HORA ── */}
              {step==="hora" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>{t("whatTime")}</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>
                      {fmtDate(selectedDate,lang).dayName}, {fmtDate(selectedDate,lang).day} {lang==="en"?"of":""} {fmtDate(selectedDate,lang).month}
                    </p>
                  </div>
                  {lunchTimes.length>0&&(
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:C.dim}}>{t("lunch")}</p>
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
                      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:C.dim}}>{t("dinner")}</p>
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
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>{t("howManyPeople")}</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>
                      {fmtDate(selectedDate,lang).dayName}, {fmtDate(selectedDate,lang).day} {lang==="en"?"of":""} {fmtDate(selectedDate,lang).month} {lang==="en"?"at":"às"} {selectedTime}
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
                  <p className="text-xs text-center" style={{color:C.dim}}>{t("largeGroups")} {restaurant.phone}</p>
                  <button onClick={()=>setStep("dados")}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:opacity-90"
                    style={{background:C.gold,color:"#fff"}}>
                    {t("continueWith")} {partySize} {partySize===1?t("person"):t("people")} <ArrowRight size={16}/>
                  </button>
                </div>
              )}

              {/* ── DADOS ── */}
              {step==="dados" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>{t("yourDetails")}</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>{t("toConfirmReservation")}</p>
                  </div>
                  {loggedIn && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border"
                      style={{background:"#f0fdf4",borderColor:"#86efac",color:"#166534"}}>
                      <Check size={14}/> Dados preenchidos pela sua conta
                    </div>
                  )}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm border"
                    style={{background:C.goldL,borderColor:C.goldB}}>
                    <CalendarDays size={14} style={{color:C.gold}}/><span style={{color:C.fg}}>{fmtDate(selectedDate,lang).dayName}, {fmtDate(selectedDate,lang).day} {lang==="en"?"of":""} {fmtDate(selectedDate,lang).month}</span>
                    <span style={{color:C.dim}}>·</span><Clock size={14} style={{color:C.gold}}/><span style={{color:C.fg}}>{selectedTime}</span>
                    <span style={{color:C.dim}}>·</span><Users size={14} style={{color:C.gold}}/><span style={{color:C.fg}}>{partySize}p</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      {label:t("fullName"),placeholder:lang==="en"?"Your name":"Seu nome",value:name,onChange:(v:string)=>setName(formatName(v)),icon:User,type:"text"},
                      {label:t("whatsappPhone"),placeholder:"(11) 99999-9999",value:phone,onChange:(v:string)=>setPhone(v),icon:Phone,type:"tel"},
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
                        {t("specialOccasion")} <span className="normal-case font-normal">({t("optional")})</span>
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
                        {t("notes")} <span className="normal-case font-normal">({t("optional")})</span>
                      </label>
                      <div className="relative">
                        <MessageSquare size={15} className="absolute left-4 top-4" style={{color:C.dim}}/>
                        <textarea rows={2} placeholder={t("notesPlaceholder")}
                          value={notes} onChange={e=>setNotes(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 text-sm resize-none" style={{fontSize:"15px"}}/>
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>setStep("confirmar")} disabled={!name||!phone}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm transition-all hover:opacity-90"
                    style={{background:C.gold,color:"#fff"}}>
                    {t("reviewReservation")} <ArrowRight size={16}/>
                  </button>
                </div>
              )}

              {/* ── CONFIRMAR ── */}
              {step==="confirmar" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight" style={{color:C.fg}}>{t("confirmReservation")}</h2>
                    <p className="text-sm mt-1" style={{color:C.muted}}>{t("reviewData")}</p>
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
                      {icon:CalendarDays,label:t("date"),value:`${fmtDate(selectedDate,lang).dayName}, ${fmtDate(selectedDate,lang).day} ${lang==="en"?"of":""} ${fmtDate(selectedDate,lang).month}`},
                      {icon:Clock,label:t("time"),value:selectedTime},
                      {icon:Users,label:t("persons"),value:`${partySize} ${partySize>1?t("people"):t("person")}`},
                      {icon:User,label:t("name"),value:name},
                      {icon:Phone,label:t("phone"),value:phone},
                      ...(occasion?[{icon:Sparkles,label:t("occasion"),value:occasion}]:[]),
                      ...(notes?[{icon:MessageSquare,label:t("obs"),value:notes}]:[]),
                    ].map(({icon:Icon,label,value})=>(
                      <div key={label} className="flex items-center gap-4 px-5 py-3.5" style={{borderColor:C.bdr2}}>
                        <Icon size={15} style={{color:C.gold,flexShrink:0}}/>
                        <span className="text-sm flex-1" style={{color:C.muted}}>{label}</span>
                        <span className="text-sm font-medium text-right" style={{color:C.fg}}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center" style={{color:C.dim}}>{t("whatsappConfirmation")}</p>
                  <button onClick={handleConfirm} disabled={loading}
                    className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                    style={{background:"#16a34a",color:"#fff"}}>
                    {loading?<span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/>
                            :<><Check size={18}/> {t("confirmReservation")}</>}
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
                <h2 className="text-2xl font-bold mb-2" style={{color:C.fg}}>{t("reservationConfirmed")}</h2>
                <p className="text-base" style={{color:C.muted}}>{t("seeYouSoon")} {name.split(" ")[0]}!</p>
              </div>
              <div className="rounded-xl border overflow-hidden divide-y text-left" style={{borderColor:C.bdr}}>
                {[
                  {icon:CalendarDays,label:t("date"),value:`${fmtDate(selectedDate,lang).dayName}, ${fmtDate(selectedDate,lang).day} ${lang==="en"?"of":""} ${fmtDate(selectedDate,lang).month}`},
                  {icon:Clock,label:t("time"),value:selectedTime},
                  {icon:Users,label:t("persons"),value:`${partySize} ${partySize>1?t("people"):t("person")}`},
                  {icon:MapPin,label:t("local"),value:restaurant.address},
                ].map(({icon:Icon,label,value})=>(
                  <div key={label} className="flex items-center gap-4 px-5 py-4" style={{borderColor:C.bdr2}}>
                    <Icon size={15} style={{color:"#16a34a",flexShrink:0}}/>
                    <span className="text-sm flex-1" style={{color:C.muted}}>{label}</span>
                    <span className="text-sm font-medium text-right" style={{color:C.fg}}>{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{color:C.dim}}>
                {t("confirmationSentTo")} <strong style={{color:C.muted}}>{phone}</strong>
              </p>
              <button onClick={()=>{setStep("inicio");setSelectedDate("");setSelectedTime("");setPartySize(2);setName("");setPhone("");setNotes("");setOccasion("");}}
                className="text-sm underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{color:C.dim}}>
                {t("anotherReservation")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
