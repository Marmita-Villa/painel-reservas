"use client";

import { useState } from "react";
import {
  CalendarDays, CheckCircle, ChevronDown, ChevronRight,
  Menu, X, Star, Zap, Crown, UtensilsCrossed, Bell,
  BarChart3, Users, Smartphone, Globe, MessageCircle, ArrowRight,
  Clock, Shield, TrendingUp
} from "lucide-react";

const brand = "#f07316";

const features = [
  { icon: CalendarDays, title: "Reservas Online 24h", desc: "Seus clientes reservam a qualquer hora pelo celular, sem precisar ligar." },
  { icon: Bell, title: "Lembretes Automáticos", desc: "WhatsApp e email enviados automaticamente 24h e 2h antes da reserva." },
  { icon: UtensilsCrossed, title: "Cardápio Digital", desc: "Cardápio bonito com QR Code, filtros por tag e link para o seu site." },
  { icon: BarChart3, title: "Relatórios & Métricas", desc: "Veja ocupação, receita estimada, no-shows e horários de pico." },
  { icon: Users, title: "Gestão de Clientes", desc: "Histórico completo de visitas, preferências e notas internas por cliente." },
  { icon: Smartphone, title: "Widget para o seu site", desc: "Incorpore o sistema de reservas direto no seu site com um simples iFrame." },
  { icon: Globe, title: "Fila de Espera", desc: "Gerencie a fila digital em dias cheios e chame clientes pelo WhatsApp." },
  { icon: Shield, title: "Controle de No-Show", desc: "Taxa de cancelamento, blacklist de clientes e confirmação por token." },
];

const steps = [
  { n: "01", title: "Cadastre seu restaurante", desc: "Crie sua conta em minutos. Configure horários, mesas e capacidade pelo painel." },
  { n: "02", title: "Compartilhe o link", desc: "Cole o widget no seu site, coloque o QR Code na mesa ou compartilhe nas redes sociais." },
  { n: "03", title: "Gerencie tudo em um lugar", desc: "Confirme reservas, veja o mapa de mesas e receba notificações em tempo real." },
];

const plans = [
  {
    key: "FREE", name: "Free", price: "R$ 0", period: "/mês",
    color: "#6b7280",
    features: ["50 reservas/mês", "1 usuário", "Widget público", "Dashboard básico"],
    cta: "Começar grátis",
  },
  {
    key: "PRO", name: "Pro", price: "R$ 97", period: "/mês",
    color: brand, popular: true,
    features: ["500 reservas/mês", "5 usuários", "WhatsApp automático", "Cardápio digital", "Relatórios avançados", "Exportar CSV"],
    cta: "Assinar Pro",
  },
  {
    key: "PREMIUM", name: "Premium", price: "R$ 197", period: "/mês",
    color: "#7c3aed",
    features: ["Reservas ilimitadas", "Usuários ilimitados", "WhatsApp automático", "Cardápio digital", "Suporte prioritário", "White label (em breve)"],
    cta: "Assinar Premium",
  },
];

const faqs = [
  { q: "Preciso instalar algum software?", a: "Não. O Reserva360 é 100% online. Acesse pelo navegador de qualquer dispositivo, sem instalação." },
  { q: "Meu cliente precisa criar uma conta para reservar?", a: "Não. O cliente preenche nome, telefone e data — sem cadastro necessário. Simples e rápido." },
  { q: "Como funciona o período gratuito?", a: "O plano Free é permanente com até 50 reservas/mês. Faça upgrade quando precisar de mais recursos." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem multa, sem fidelidade. Cancele quando quiser diretamente pelo painel." },
  { q: "O cardápio digital está incluso em todos os planos?", a: "O cardápio digital está disponível nos planos PRO e PREMIUM." },
  { q: "Funciona para bares, cafés e hotéis também?", a: "Sim! O sistema funciona para qualquer estabelecimento que precise gerenciar reservas." },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#fff", color: "#18181b", fontFamily: "system-ui, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b"
        style={{ background: "rgba(255,255,255,0.95)", borderColor: "#f4f4f5", backdropFilter: "blur(8px)" }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Reserva360" style={{ height: 36, objectFit: "contain" }} />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {[["#funcionalidades", "Funcionalidades"], ["#como-funciona", "Como funciona"], ["#planos", "Planos"], ["#faq", "FAQ"]].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: "#52525b" }}>{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="text-sm font-medium px-4 py-2 rounded-xl transition-all hover:opacity-80"
              style={{ color: "#52525b" }}>
              Entrar
            </a>
            <a href="/login" className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ background: brand, color: "#fff" }}>
              Começar grátis
            </a>
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-5 py-4 space-y-3" style={{ borderColor: "#f4f4f5" }}>
            {[["#funcionalidades", "Funcionalidades"], ["#como-funciona", "Como funciona"], ["#planos", "Planos"], ["#faq", "FAQ"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium py-1" style={{ color: "#52525b" }}>{label}</a>
            ))}
            <a href="/login"
              className="block w-full text-center text-sm font-semibold py-3 rounded-xl mt-2"
              style={{ background: brand, color: "#fff" }}>
              Começar grátis
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* background gradient */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, #fff8f3 0%, #fff 60%)" }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "rgba(240,115,22,0.07)", filter: "blur(80px)", transform: "translate(30%, -30%)" }} />

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(240,115,22,0.1)", color: brand, border: `1px solid rgba(240,115,22,0.2)` }}>
            🚀 Sistema completo de reservas para restaurantes
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight mb-6"
            style={{ color: "#0c0c0e" }}>
            Chega de reservas<br />
            <span style={{ color: brand }}>perdidas no WhatsApp</span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "#71717a" }}>
            O Reserva360 automatiza suas reservas, envia lembretes pelo WhatsApp, mostra seu cardápio digital e dá controle total da sua operação — tudo em um único painel.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 shadow-lg"
              style={{ background: brand, color: "#fff", boxShadow: `0 8px 24px rgba(240,115,22,0.35)` }}>
              Começar grátis agora <ArrowRight size={18} />
            </a>
            <a href="#como-funciona"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:opacity-80"
              style={{ background: "#f4f4f5", color: "#18181b" }}>
              Ver como funciona
            </a>
          </div>

          <p className="text-xs mt-4" style={{ color: "#a1a1aa" }}>
            ✓ Grátis para sempre até 50 reservas/mês &nbsp;·&nbsp; ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Cancele quando quiser
          </p>

          {/* Mock dashboard preview */}
          <div className="mt-16 relative mx-auto max-w-4xl">
            <div className="rounded-2xl overflow-hidden shadow-2xl border"
              style={{ borderColor: "#e4e4e7" }}>
              <div className="h-8 flex items-center gap-2 px-4"
                style={{ background: "#18181b" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
                <div className="flex-1 mx-4 h-5 rounded-md" style={{ background: "#27272a" }} />
              </div>
              <div className="p-6 grid grid-cols-3 gap-4" style={{ background: "#fafafa" }}>
                {[
                  { label: "Reservas hoje", value: "24", color: brand },
                  { label: "Ocupação", value: "87%", color: "#22c55e" },
                  { label: "No-shows", value: "2", color: "#ef4444" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-4 text-left"
                    style={{ background: "#fff", border: "1px solid #e4e4e7" }}>
                    <p className="text-xs" style={{ color: "#71717a" }}>{stat.label}</p>
                    <p className="text-2xl font-black mt-1" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6" style={{ background: "#fafafa" }}>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#e4e4e7" }}>
                  {["João Silva — 19:00 — 4 pessoas", "Maria Oliveira — 19:30 — 2 pessoas", "Pedro Santos — 20:00 — 6 pessoas"].map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 text-sm border-b last:border-0"
                      style={{ borderColor: "#f4f4f5", background: "#fff" }}>
                      <span style={{ color: "#18181b" }}>{row}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>Confirmado</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* glow */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 pointer-events-none"
              style={{ background: `rgba(240,115,22,0.15)`, filter: "blur(20px)" }} />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="border-y py-10" style={{ borderColor: "#f4f4f5", background: "#fafafa" }}>
        <div className="max-w-4xl mx-auto px-5 text-center">
          <p className="text-sm font-medium mb-6" style={{ color: "#a1a1aa" }}>
            Funcionalidades que seu restaurante precisa
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {["Reservas Online", "WhatsApp Automático", "Cardápio Digital", "Relatórios", "Fila de Espera", "Multi-usuário"].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#52525b" }}>
                <CheckCircle size={15} style={{ color: brand }} /> {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-2" style={{ color: brand }}>FUNCIONALIDADES</p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#0c0c0e" }}>
              Tudo que você precisa,<br />sem complicação
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 rounded-2xl border transition-all hover:shadow-md"
                style={{ background: "#fff", borderColor: "#e4e4e7" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(240,115,22,0.1)" }}>
                  <Icon size={18} style={{ color: brand }} />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: "#0c0c0e" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#71717a" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARDÁPIO DIGITAL DESTAQUE ── */}
      <section className="py-24" style={{ background: "#0c0c0e" }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6"
                style={{ background: "rgba(240,115,22,0.15)", color: brand, border: `1px solid rgba(240,115,22,0.3)` }}>
                <Zap size={11} /> EXCLUSIVO PRO & PREMIUM
              </div>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-5" style={{ color: "#fafafa" }}>
                Cardápio Digital<br />
                <span style={{ color: brand }}>com a sua identidade</span>
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "#a1a1aa" }}>
                Crie um cardápio bonito com a cor da sua marca, fotos dos pratos, filtros por categoria e tag. Compartilhe o link no Google, Instagram ou cole no seu site.
              </p>
              <ul className="space-y-3">
                {["Cor da marca personalizada", "QR Code para imprimir na mesa", "Filtros por vegetariano, sem glúten, etc.", "Itens esgotados com badge automático", "Busca em tempo real"].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "#d4d4d8" }}>
                    <CheckCircle size={15} style={{ color: brand }} /> {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Mini preview dark menu */}
            <div className="rounded-2xl overflow-hidden border"
              style={{ background: "#141416", borderColor: "#27272a" }}>
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "#27272a" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{ background: brand, color: "#fff" }}>R</div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#fafafa" }}>Ristorante Roma</p>
                  <p className="text-xs" style={{ color: "#71717a" }}>Cardápio Digital · 28 itens</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { name: "Spaghetti Carbonara", price: "R$ 62,00", tag: "Mais pedido ⭐" },
                  { name: "Bruschetta al Pomodoro", price: "R$ 28,00", tag: "Vegetariano 🥦" },
                  { name: "Tiramisù", price: "R$ 35,00", tag: "Novidade ✨" },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: "#18181b", border: "1px solid #27272a" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#fafafa" }}>{item.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{ background: "#27272a", color: "#a1a1aa" }}>{item.tag}</span>
                    </div>
                    <p className="font-black text-sm" style={{ color: brand }}>{item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="py-24" style={{ background: "#fafafa" }}>
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-2" style={{ color: brand }}>COMO FUNCIONA</p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#0c0c0e" }}>
              Pronto em 3 passos simples
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-5"
                  style={{ background: "rgba(240,115,22,0.1)", color: brand }}>
                  {n}
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: "#0c0c0e" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#71717a" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="py-24">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-2" style={{ color: brand }}>PLANOS & PREÇOS</p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ color: "#0c0c0e" }}>
              Comece grátis, cresça quando quiser
            </h2>
            <p className="text-base mt-3" style={{ color: "#71717a" }}>
              Sem fidelidade. Cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.key}
                className="rounded-2xl border overflow-hidden relative"
                style={{
                  background: "#fff",
                  borderColor: plan.popular ? plan.color : "#e4e4e7",
                  boxShadow: plan.popular ? `0 0 0 2px ${plan.color}` : undefined,
                }}>
                {plan.popular && (
                  <div className="text-center py-1.5 text-xs font-bold"
                    style={{ background: plan.color, color: "#fff" }}>
                    ⭐ Mais popular
                  </div>
                )}
                <div className="p-6 space-y-5">
                  <div>
                    <p className="font-bold text-base" style={{ color: plan.color }}>{plan.name}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black" style={{ color: "#0c0c0e" }}>{plan.price}</span>
                      <span className="text-sm" style={{ color: "#a1a1aa" }}>{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#52525b" }}>
                        <CheckCircle size={14} style={{ color: plan.color }} /> {f}
                      </li>
                    ))}
                  </ul>
                  <a href="/login"
                    className="block w-full text-center py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: plan.popular ? plan.color : "#f4f4f5", color: plan.popular ? "#fff" : "#18181b" }}>
                    {plan.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20" style={{ background: brand }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: "#fff" }}>
            Seu restaurante merece um sistema profissional
          </h2>
          <p className="text-base mb-8 opacity-90" style={{ color: "#fff" }}>
            Comece gratuitamente hoje. Sem cartão de crédito.
          </p>
          <a href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90"
            style={{ background: "#fff", color: brand }}>
            Criar conta grátis <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24" style={{ background: "#fafafa" }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold mb-2" style={{ color: brand }}>FAQ</p>
            <h2 className="text-3xl font-black" style={{ color: "#0c0c0e" }}>Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="rounded-2xl border overflow-hidden"
                style={{ borderColor: "#e4e4e7", background: "#fff" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  style={{ color: "#0c0c0e" }}>
                  <span className="font-semibold text-sm">{q}</span>
                  <ChevronDown size={16} className="flex-shrink-0 transition-transform"
                    style={{ color: "#a1a1aa", transform: openFaq === i ? "rotate(180deg)" : "none" }} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "#71717a" }}>
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-10" style={{ borderColor: "#e4e4e7" }}>
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Reserva360" style={{ height: 28, objectFit: "contain" }} />
          <div className="flex gap-6">
            {[["#funcionalidades", "Funcionalidades"], ["#planos", "Planos"], ["/login", "Entrar"]].map(([href, label]) => (
              <a key={href} href={href} className="text-xs transition-opacity hover:opacity-60"
                style={{ color: "#a1a1aa" }}>{label}</a>
            ))}
          </div>
          <p className="text-xs" style={{ color: "#a1a1aa" }}>
            © {new Date().getFullYear()} Reserva360. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
