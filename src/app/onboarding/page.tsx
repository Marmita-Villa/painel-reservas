"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, ChevronRight, Clock, LayoutGrid, Rocket, Store, Users } from "lucide-react";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Schedule {
  dayOfWeek: number;
  isActive: boolean;
  openTime: string;
  closeTime: string;
  slotInterval: number;
}

const defaultSchedules: Schedule[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isActive: i >= 2 && i <= 6, // Ter–Sáb default
  openTime: "19:00",
  closeTime: "23:00",
  slotInterval: 30,
}));

type Step = "boas-vindas" | "horarios" | "mesa" | "concluido";
const stepOrder: Step[] = ["boas-vindas", "horarios", "mesa", "concluido"];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const restaurantId = user?.restaurantId;

  const [step, setStep] = useState<Step>("boas-vindas");
  const [schedules, setSchedules] = useState<Schedule[]>(defaultSchedules);
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [tableName, setTableName] = useState("Mesa 1");
  const [tableCapacity, setTableCapacity] = useState(4);
  const [savingTable, setSavingTable] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (!restaurantId) return;
    // Check if already onboarded
    const done = localStorage.getItem(`onboarding_done_${restaurantId}`);
    if (done) router.replace("/dashboard");
    // Build widget URL
    if (user?.role !== "MASTER_SUPER") {
      fetch(`/api/restaurants/${restaurantId}`)
        .then(r => r.json())
        .then(d => { if (d.slug) setWidgetUrl(`${window.location.origin}/r/${d.slug}`); })
        .catch(() => {});
    }
  }, [restaurantId, user, router]);

  if (status === "loading") return null;

  function updateSchedule(i: number, field: keyof Schedule, value: any) {
    setSchedules(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  async function handleSaveSchedules() {
    if (!restaurantId) return;
    setSavingSchedules(true);
    try {
      await fetch(`/api/restaurants/${restaurantId}/schedules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedules),
      });
      setStep("mesa");
    } catch {}
    setSavingSchedules(false);
  }

  async function handleSaveTable() {
    if (!restaurantId) return;
    setSavingTable(true);
    try {
      // Get or create default room first
      const rRes = await fetch(`/api/restaurants/${restaurantId}`);
      const rData = await rRes.json();
      const rooms = rData.rooms ?? [];
      let roomId = rooms[0]?.id;
      if (!roomId) {
        const roomRes = await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId, name: "Salão Principal", type: "room" }),
        });
        // fallback: just skip if no room available
      }
      if (roomId) {
        await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, name: tableName, capacity: tableCapacity }),
        });
      }
    } catch {}
    setSavingTable(false);
    setStep("concluido");
  }

  function handleSkipTable() {
    setStep("concluido");
  }

  function handleFinish() {
    if (restaurantId) localStorage.setItem(`onboarding_done_${restaurantId}`, "1");
    router.replace("/dashboard");
  }

  const stepIdx = stepOrder.indexOf(step);

  const C = {
    bg: "var(--background)",
    sur: "var(--surface)",
    bdr: "var(--border)",
    fg: "var(--foreground)",
    muted: "var(--foreground-muted)",
    primary: "var(--primary)",
  };

  const steps = [
    { key: "boas-vindas", label: "Boas-vindas" },
    { key: "horarios",    label: "Horários" },
    { key: "mesa",        label: "Mesa" },
    { key: "concluido",   label: "Pronto!" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: C.bg }}>
      <div className="w-full max-w-2xl space-y-6">

        {/* Progress */}
        {step !== "concluido" && (
          <div className="flex items-center gap-2">
            {steps.slice(0, 3).map((s, i) => {
              const done = i < stepIdx;
              const current = i === stepIdx;
              return (
                <div key={s.key} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: done ? "var(--success)" : current ? C.primary : "var(--surface-2)",
                        color: done || current ? "#fff" : C.muted,
                      }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className="text-xs font-medium hidden sm:block"
                      style={{ color: current ? C.fg : C.muted }}>{s.label}</span>
                  </div>
                  {i < 2 && <div className="flex-1 h-px mx-2" style={{ background: done ? "var(--success)" : "var(--border)" }} />}
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-2xl border overflow-hidden shadow-lg" style={{ background: C.sur, borderColor: C.bdr }}>

          {/* BOAS-VINDAS */}
          {step === "boas-vindas" && (
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: `${C.primary}15` }}>
                <Rocket size={36} style={{ color: C.primary }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-3" style={{ color: C.fg }}>
                  Bem-vindo ao Réservé, {user?.name?.split(" ")[0]}!
                </h1>
                <p className="text-base leading-relaxed" style={{ color: C.muted }}>
                  Em menos de 2 minutos vamos configurar seu restaurante para começar a receber reservas online.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-left">
                {[
                  { icon: Clock,       label: "Horários",  desc: "Configure quando aceita reservas" },
                  { icon: LayoutGrid,  label: "Mesas",     desc: "Cadastre sua primeira mesa" },
                  { icon: CalendarDays,label: "Widget",    desc: "Link pronto para compartilhar" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="rounded-xl p-4 border space-y-2"
                    style={{ background: "var(--surface-2)", borderColor: C.bdr }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${C.primary}20` }}>
                      <Icon size={15} style={{ color: C.primary }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: C.fg }}>{label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{desc}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep("horarios")}
                className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: C.primary, color: "#fff" }}>
                Começar configuração <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* HORÁRIOS */}
          {step === "horarios" && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: C.fg }}>Quando você abre?</h2>
                <p className="text-sm mt-1" style={{ color: C.muted }}>Configure os horários em que aceita reservas online.</p>
              </div>
              <div className="space-y-3">
                {schedules.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 flex-wrap">
                    <div className="w-10">
                      <input type="checkbox" checked={s.isActive}
                        onChange={e => updateSchedule(i, "isActive", e.target.checked)}
                        className="accent-purple-500" />
                    </div>
                    <span className="w-8 text-sm font-medium" style={{ color: s.isActive ? C.fg : C.muted }}>
                      {days[i]}
                    </span>
                    <input type="time" value={s.openTime} disabled={!s.isActive}
                      onChange={e => updateSchedule(i, "openTime", e.target.value)}
                      className="px-2 py-1.5 rounded-lg text-sm outline-none disabled:opacity-40"
                      style={{ background: "var(--surface-2)", border: `1px solid ${C.bdr}`, color: C.fg }} />
                    <span className="text-xs" style={{ color: C.muted }}>até</span>
                    <input type="time" value={s.closeTime} disabled={!s.isActive}
                      onChange={e => updateSchedule(i, "closeTime", e.target.value)}
                      className="px-2 py-1.5 rounded-lg text-sm outline-none disabled:opacity-40"
                      style={{ background: "var(--surface-2)", border: `1px solid ${C.bdr}`, color: C.fg }} />
                    <select value={s.slotInterval} disabled={!s.isActive}
                      onChange={e => updateSchedule(i, "slotInterval", Number(e.target.value))}
                      className="px-2 py-1.5 rounded-lg text-sm outline-none disabled:opacity-40"
                      style={{ background: "var(--surface-2)", border: `1px solid ${C.bdr}`, color: C.fg }}>
                      <option value={30}>30 min</option>
                      <option value={60}>1 hora</option>
                      <option value={120}>2 horas</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep("mesa")} className="px-4 py-2.5 rounded-xl text-sm border transition-opacity hover:opacity-70"
                  style={{ borderColor: C.bdr, color: C.muted }}>
                  Pular
                </button>
                <button onClick={handleSaveSchedules} disabled={savingSchedules}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: C.primary, color: "#fff" }}>
                  {savingSchedules ? "Salvando..." : <>Salvar horários <ChevronRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {/* MESA */}
          {step === "mesa" && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: C.fg }}>Cadastre sua primeira mesa</h2>
                <p className="text-sm mt-1" style={{ color: C.muted }}>Você pode adicionar mais mesas depois em Mesas.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: C.muted }}>
                    Nome da mesa
                  </label>
                  <input type="text" value={tableName} onChange={e => setTableName(e.target.value)}
                    placeholder="Ex: Mesa 1, Mesa VIP, Varanda..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: `1px solid ${C.bdr}`, color: C.fg }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: C.muted }}>
                    Capacidade (pessoas)
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[2, 4, 6, 8, 10, 12].map(n => (
                      <button key={n} onClick={() => setTableCapacity(n)}
                        className="py-3 rounded-xl text-sm font-bold border transition-all"
                        style={{
                          background: tableCapacity === n ? C.primary : "var(--surface-2)",
                          borderColor: tableCapacity === n ? C.primary : C.bdr,
                          color: tableCapacity === n ? "#fff" : C.fg,
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSkipTable} className="px-4 py-2.5 rounded-xl text-sm border transition-opacity hover:opacity-70"
                  style={{ borderColor: C.bdr, color: C.muted }}>
                  Pular
                </button>
                <button onClick={handleSaveTable} disabled={savingTable || !tableName}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: C.primary, color: "#fff" }}>
                  {savingTable ? "Criando..." : <>Criar mesa <ChevronRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {/* CONCLUÍDO */}
          {step === "concluido" && (
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4"
                style={{ background: "rgba(34,197,94,0.1)", borderColor: "#86efac" }}>
                <CheckCircle2 size={40} style={{ color: "#16a34a" }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: C.fg }}>Tudo pronto!</h2>
                <p className="text-base" style={{ color: C.muted }}>
                  Seu restaurante está configurado e pronto para receber reservas.
                </p>
              </div>
              {widgetUrl && (
                <div className="rounded-xl border p-5 text-left space-y-3"
                  style={{ background: "var(--surface-2)", borderColor: C.bdr }}>
                  <p className="text-sm font-semibold" style={{ color: C.fg }}>Seu link de reservas:</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={widgetUrl}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none"
                      style={{ background: "var(--surface-3, var(--surface))", border: `1px solid ${C.bdr}`, color: C.fg }} />
                    <button onClick={() => navigator.clipboard.writeText(widgetUrl)}
                      className="px-3 py-2 rounded-lg text-xs font-medium border transition-opacity hover:opacity-70"
                      style={{ borderColor: C.bdr, color: C.muted }}>
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: C.muted }}>
                    Compartilhe este link no Instagram, WhatsApp ou cole no seu site.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <a href="/mesas" className="py-3 rounded-xl text-sm font-medium border text-center transition-opacity hover:opacity-70"
                  style={{ borderColor: C.bdr, color: C.muted }}>
                  Gerenciar mesas
                </a>
                <button onClick={handleFinish}
                  className="py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: C.primary, color: "#fff" }}>
                  Ir para o Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
