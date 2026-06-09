"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Phone, CalendarDays, Search, X, ChevronUp, UtensilsCrossed, Sun, Moon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import LangToggle from "@/components/LangToggle";

interface MenuItem {
  id: string; name: string; description?: string | null;
  price?: number | null; imageUrl?: string | null;
  tags: string[]; isSoldOut?: boolean;
}
interface MenuCategory { id: string; name: string; description?: string | null; items: MenuItem[]; }
interface Restaurant {
  name: string; slug: string; address?: string | null;
  phone?: string | null; logoUrl?: string | null; coverUrl?: string | null;
  logoShape?: string | null; plan: string; primaryColor?: string | null;
}

function getLogoRadius(shape: string | null | undefined): string {
  switch (shape) {
    case "circle":    return "50%";
    case "square":    return "6px";
    case "rectangle": return "12px";
    default:          return "20px"; // rounded
  }
}
function getLogoSize(shape: string | null | undefined): { width: number | string; height: number } {
  return shape === "rectangle"
    ? { width: "auto", height: 100 }  // retângulo: altura fixa, largura livre
    : { width: 112, height: 112 };    // demais: quadrado grande
}

function formatPrice(p: number) {
  return `R$ ${p.toFixed(2).replace(".", ",")}`;
}

// ── Colour palettes ─────────────────────────────────────────────────────────
const DARK = {
  bg:         "#1a1d27",
  card:       "#242736",
  surface:    "#2d3144",
  border:     "#323649",
  border2:    "#3d4260",
  text:       "#eef0ff",
  textMuted:  "#9ba3c4",
  textDim:    "#5c6489",
  header:     "rgba(26,29,39,0.97)",
  inputBg:    "#2d3144",
  placeholder:"#5c6489",
  divider:    "rgba(255,255,255,0.06)",
};
const LIGHT = {
  bg:         "#f4f6fc",
  card:       "#ffffff",
  surface:    "#eef0f8",
  border:     "#dde1f0",
  border2:    "#c8cee6",
  text:       "#111827",
  textMuted:  "#374151",
  textDim:    "#9ca3af",
  header:     "rgba(244,246,252,0.97)",
  inputBg:    "#ffffff",
  placeholder:"#9ca3af",
  divider:    "rgba(0,0,0,0.06)",
};

// ── Category & Tag translations ──────────────────────────────────────────────
const CAT_EN: Record<string, string> = {
  "Entradas": "Starters", "Massas": "Pasta", "Pratos Principais": "Main Courses",
  "Pizzas": "Pizzas", "Sobremesas": "Desserts", "Bebidas": "Beverages",
  "Petiscos": "Snacks", "Saladas": "Salads", "Lanches": "Sandwiches",
  "Sucos": "Juices", "Cervejas": "Beers", "Vinhos": "Wines",
  "Drinks": "Cocktails", "Frutos do Mar": "Seafood", "Carnes": "Meats",
  "Aves": "Poultry", "Peixes": "Fish", "Risotos": "Risottos",
  "Sopas": "Soups", "Infantil": "Kids Menu", "Vegano": "Vegan",
  "Vegetariano": "Vegetarian", "Grelhados": "Grilled", "Combos": "Combos",
  "Promoções": "Specials", "Especiais": "Specials", "Porções": "Portions",
  "Acompanhamentos": "Sides", "Doces": "Sweets", "Salgados": "Savory",
};

const TAG_EN: Record<string, string> = {
  "Vegetariano 🥦": "Vegetarian 🥦",
  "Vegan 🌱": "Vegan 🌱",
  "Vegano 🌱": "Vegan 🌱",
  "Sem glúten 🌾": "Gluten-free 🌾",
  "Sem lactose 🥛": "Lactose-free 🥛",
  "Picante 🌶️": "Spicy 🌶️",
  "Novidade ✨": "New ✨",
  "Mais pedido ⭐": "Best seller ⭐",
};

function catName(name: string, lang: "pt" | "en") {
  return lang === "en" ? (CAT_EN[name] ?? name) : name;
}
function tagName(tag: string, lang: "pt" | "en") {
  return lang === "en" ? (TAG_EN[tag] ?? tag) : tag;
}

// ── Tag badge colours ────────────────────────────────────────────────────────
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  "Vegetariano 🥦": { bg: "#dcfce7", color: "#15803d" },
  "Vegan 🌱":       { bg: "#d1fae5", color: "#047857" },
  "Vegano 🌱":      { bg: "#d1fae5", color: "#047857" },
  "Sem glúten 🌾":  { bg: "#fef9c3", color: "#a16207" },
  "Sem lactose 🥛": { bg: "#e0f2fe", color: "#0369a1" },
  "Picante 🌶️":     { bg: "#fee2e2", color: "#b91c1c" },
  "Novidade ✨":    { bg: "#ede9fe", color: "#6d28d9" },
  "Mais pedido ⭐": { bg: "#fff7ed", color: "#c2410c" },
};

function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Auto-detect day/night ────────────────────────────────────────────────────
function getAutoTheme(): "light" | "dark" {
  const h = new Date().getHours();
  return h >= 6 && h < 19 ? "light" : "dark";
}

export default function MenuPageClient({
  restaurant, categories, hasPlan,
}: {
  restaurant: Restaurant;
  categories: MenuCategory[];
  hasPlan: boolean;
}) {
  const { lang, setLang } = useTranslation();
  const brand = restaurant.primaryColor ?? "#f07316";

  const [search,         setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [activeTag,      setActiveTag]      = useState<string | null>(null);
  const [showBackToTop,  setShowBackToTop]  = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [theme,          setTheme]          = useState<"light" | "dark">("light"); // SSR-safe
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollingRef = useRef(false);

  // Set theme on client (auto by time, then respect manual toggle)
  useEffect(() => { setTheme(getAutoTheme()); }, []);

  const C = theme === "dark" ? DARK : LIGHT;
  const allTags    = Array.from(new Set(categories.flatMap(c => c.items.flatMap(i => i.tags))));
  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);

  const filtered = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || q.length < 2 ||
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);
      const matchTag = !activeTag || item.tags.includes(activeTag);
      return matchSearch && matchTag;
    }),
  })).filter(cat => cat.items.length > 0);

  function scrollToCategory(id: string) {
    setActiveCategory(id);
    const el = categoryRefs.current[id];
    if (!el) return;
    const headerH = document.getElementById("sticky-header")?.offsetHeight ?? 120;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
    scrollingRef.current = true;
    clearTimeout((scrollingRef as any)._timer);
    (scrollingRef as any)._timer = setTimeout(() => { scrollingRef.current = false; }, 1000);
    window.scrollTo({ top, behavior: "smooth" });
  }

  useEffect(() => {
    const handler = () => {
      setShowBackToTop(window.scrollY > 400);
      setHeaderScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (scrollingRef.current) return;
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute("data-cat-id");
          if (id) setActiveCategory(id);
        }
      },
      { root: null, rootMargin: "-10% 0px -80% 0px", threshold: 0 }
    );
    categories.forEach(cat => {
      const el = categoryRefs.current[cat.id];
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [categories]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)", transition: "background 0.3s, color 0.3s" }}>

      {/* ── HERO ── */}
      {!search && (
        <div className="relative overflow-hidden" style={{
          minHeight: restaurant.coverUrl ? 320 : undefined,
          borderBottom: `1px solid ${hexAlpha(brand, theme === "dark" ? 0.25 : 0.15)}`,
        }}>
          {/* Banner image or gradient background */}
          {restaurant.coverUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={restaurant.coverUrl} alt="banner"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
              {/* overlay escuro/claro sobre a foto */}
              <div style={{
                position: "absolute", inset: 0,
                background: theme === "dark"
                  ? "linear-gradient(to bottom, rgba(26,29,39,0.55) 0%, rgba(26,29,39,0.85) 100%)"
                  : "linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.82) 100%)",
              }} />
            </>
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: theme === "dark"
                ? `linear-gradient(160deg, #1a1d27 0%, ${hexAlpha(brand, 0.18)} 50%, ${hexAlpha(brand, 0.32)} 100%)`
                : `linear-gradient(160deg, #ffffff 0%, ${hexAlpha(brand, 0.06)} 50%, ${hexAlpha(brand, 0.14)} 100%)`,
            }} />
          )}
          {/* glow blobs (sem banner) */}
          {!restaurant.coverUrl && <>
            <div className="absolute pointer-events-none" style={{
              top: -60, right: -60, width: 280, height: 280, borderRadius: "50%",
              background: hexAlpha(brand, theme === "dark" ? 0.14 : 0.08), filter: "blur(70px)",
            }} />
            <div className="absolute pointer-events-none" style={{
              bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%",
              background: hexAlpha(brand, theme === "dark" ? 0.08 : 0.05), filter: "blur(50px)",
            }} />
          </>}

          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "2.5rem 1.25rem 2rem", position: "relative", zIndex: 1 }}>

            {/* Top bar: lang + theme toggle */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1.75rem" }}>
              <LangToggle lang={lang} setLang={setLang} />
              <button
                onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Modo claro" : "Modo escuro"}
                style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.375rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem",
                  background: hexAlpha(brand, 0.12), color: brand,
                  border: `1px solid ${hexAlpha(brand, 0.3)}`, cursor: "pointer", fontWeight: 600,
                }}>
                {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
                {theme === "dark" ? (lang === "en" ? "Light" : "Claro") : (lang === "en" ? "Dark" : "Escuro")}
              </button>
            </div>

            {/* Logo + info — centrado */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem" }}>

              {/* Badge "Cardápio Digital" */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.375rem",
                padding: "0.35rem 1rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
                letterSpacing: "0.04em", textTransform: "uppercase",
                background: brand, color: "#fff",
                boxShadow: `0 4px 16px ${hexAlpha(brand, 0.4)}`,
              }}>
                <UtensilsCrossed size={12} />
                {lang === "en" ? "Digital Menu" : "Cardápio Digital"}
              </div>

              {/* Logo — sem container, imagem livre */}
              {restaurant.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  style={{
                    maxHeight: 130,
                    maxWidth: 300,
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    mixBlendMode: theme === "light" ? "multiply" : "normal",
                    filter: theme === "dark"
                      ? `drop-shadow(0 8px 28px ${hexAlpha(brand, 0.45)})`
                      : `drop-shadow(0 6px 20px ${hexAlpha(brand, 0.3)})`,
                  }}
                />
              ) : (
                <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: brand,
                  boxShadow: `0 12px 36px ${hexAlpha(brand, 0.45)}`,
                }}>
                  <span style={{ fontSize: "2.75rem", fontWeight: 900, color: "#fff" }}>{restaurant.name[0]}</span>
                </div>
              )}

              {/* Restaurant name */}
              <div>
                <h1 style={{ fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.01em", color: C.text, lineHeight: 1.1, fontFamily: "var(--font-playfair, Georgia, serif)", fontStyle: "italic" }}>
                  {restaurant.name}
                </h1>

                {/* Info row */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", marginTop: "0.75rem" }}>
                  {restaurant.address && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: C.textMuted }}>
                      <MapPin size={13} style={{ color: brand }} /> {restaurant.address}
                    </span>
                  )}
                  {restaurant.phone && (
                    <a href={`tel:${restaurant.phone}`} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: C.textMuted, textDecoration: "none" }}>
                      <Phone size={13} style={{ color: brand }} /> {restaurant.phone}
                    </a>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: C.textMuted }}>
                    <UtensilsCrossed size={13} style={{ color: brand }} />
                    {totalItems} {lang === "en" ? "items" : "itens"} · {categories.length} {lang === "en" ? "categories" : "categorias"}
                  </span>
                </div>
              </div>

              {/* CTA button */}
              <a href={`/r/${restaurant.slug}`} style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem 1.75rem", borderRadius: "0.875rem",
                background: brand, color: "#fff", fontWeight: 700, fontSize: "0.9375rem",
                textDecoration: "none", boxShadow: `0 6px 24px ${hexAlpha(brand, 0.45)}`,
                transition: "opacity 0.15s",
              }}>
                <CalendarDays size={16} />
                {lang === "en" ? "Reserve a table" : "Fazer uma reserva"}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY HEADER ── */}
      <header id="sticky-header" style={{
        position: "sticky", top: 0, zIndex: 30,
        background: headerScrolled ? C.header : C.bg,
        borderBottom: `1px solid ${headerScrolled ? hexAlpha(brand, 0.18) : C.border}`,
        backdropFilter: "blur(16px)",
        transition: "background 0.2s, border-color 0.2s",
      }}>

        {/* Search bar */}
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0.75rem 1rem 0.5rem" }}>
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: C.placeholder }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === "en" ? "Search dishes…" : "Buscar pratos…"}
              style={{
                width: "100%", paddingLeft: "2.5rem", paddingRight: search ? "2.5rem" : "0.875rem",
                paddingTop: "0.625rem", paddingBottom: "0.625rem",
                borderRadius: "0.875rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
                background: C.inputBg, border: `1.5px solid ${search ? brand : C.border}`,
                color: C.text, transition: "border-color 0.15s",
                boxShadow: search ? `0 0 0 3px ${hexAlpha(brand, 0.12)}` : "none",
              }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textDim }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "0.375rem", overflowX: "auto", padding: "0 1rem 0.75rem", scrollbarWidth: "none", justifyContent: "center", flexWrap: "wrap" }}>
              {categories.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <button key={cat.id} onClick={() => scrollToCategory(cat.id)} style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.4rem 0.875rem", borderRadius: "999px",
                    fontSize: "0.8125rem", fontWeight: isActive ? 700 : 500,
                    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                    background: isActive ? brand : C.surface,
                    color: isActive ? "#fff" : C.textMuted,
                    border: `1.5px solid ${isActive ? brand : C.border}`,
                    boxShadow: isActive ? `0 2px 14px ${hexAlpha(brand, 0.35)}` : "none",
                  }}>
                    {catName(cat.name, lang)}
                    <span style={{ fontSize: "0.7rem", opacity: 0.7, fontWeight: 400 }}>{cat.items.length}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tag filters */}
        {allTags.length > 0 && !search && (
          <div style={{ maxWidth: 1080, margin: "0 auto", borderTop: `1px solid ${C.divider}` }}>
            <div style={{ display: "flex", gap: "0.375rem", overflowX: "auto", padding: "0.5rem 1rem 0.625rem", scrollbarWidth: "none", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.textDim, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {lang === "en" ? "Filter" : "Filtrar"}
              </span>
              {[null, ...allTags].map((tag, i) => {
                const isActive = tag === null ? activeTag === null : activeTag === tag;
                const label = tag === null ? (lang === "en" ? "All" : "Todos") : tagName(tag, lang);
                return (
                  <button key={i} onClick={() => setActiveTag(tag)} style={{
                    flexShrink: 0, padding: "0.3rem 0.75rem", borderRadius: "999px",
                    fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, cursor: "pointer",
                    whiteSpace: "nowrap", transition: "all 0.15s",
                    background: isActive ? brand : "transparent",
                    color: isActive ? "#fff" : C.textMuted,
                    border: `1.5px solid ${isActive ? brand : C.border}`,
                  }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

        {!hasPlan ? (
          <div style={{ padding: "5rem 0", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <UtensilsCrossed size={32} style={{ color: C.textDim }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: "1.125rem", color: C.textMuted }}>
              {lang === "en" ? "Menu not available" : "Cardápio não disponível"}
            </p>
            <p style={{ fontSize: "0.875rem", color: C.textDim, marginTop: "0.5rem" }}>
              {lang === "en" ? "The restaurant hasn't published their menu yet." : "O restaurante ainda não publicou o cardápio."}
            </p>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ padding: "5rem 0", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <Search size={28} style={{ color: C.textDim }} />
            </div>
            <p style={{ fontWeight: 700, color: C.textMuted }}>
              {lang === "en" ? "No dishes found" : "Nenhum prato encontrado"}
            </p>
            <button onClick={() => { setSearch(""); setActiveTag(null); }} style={{
              marginTop: "1rem", padding: "0.5rem 1.25rem", borderRadius: "999px",
              background: hexAlpha(brand, 0.12), color: brand, border: `1.5px solid ${hexAlpha(brand, 0.3)}`,
              fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
            }}>
              {lang === "en" ? "Clear filters" : "Limpar filtros"}
            </button>
          </div>

        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {filtered.map(cat => (
              <section key={cat.id}
                ref={el => { categoryRefs.current[cat.id] = el; }}
                data-cat-id={cat.id}>

                {/* Category heading */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ width: 4, height: 22, borderRadius: 4, background: brand, flexShrink: 0 }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, letterSpacing: "0", fontFamily: "var(--font-playfair, Georgia, serif)", fontStyle: "italic" }}>
                    {catName(cat.name, lang)}
                  </h2>
                  <div style={{ flex: 1, height: 1, background: C.divider }} />
                  <span style={{
                    fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.625rem",
                    borderRadius: "999px", background: C.surface, color: C.textDim,
                    border: `1px solid ${C.border}`,
                  }}>{cat.items.length}</span>
                </div>

                {/* Items grid */}
                <div className="menu-grid" style={{ display: "grid", gap: "0.875rem" }}>
                  {cat.items.map(item => {
                    const soldOut = item.isSoldOut === true;
                    return (
                      <div key={item.id} style={{
                        borderRadius: "1.125rem", overflow: "hidden",
                        background: C.card, border: `1px solid ${C.border}`,
                        opacity: soldOut ? 0.65 : 1,
                        boxShadow: theme === "light" ? "0 1px 6px rgba(0,0,0,0.07)" : "none",
                        transition: "transform 0.15s, box-shadow 0.15s",
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = theme === "light" ? `0 8px 24px rgba(0,0,0,0.1)` : `0 8px 24px ${hexAlpha(brand, 0.12)}`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = theme === "light" ? "0 1px 6px rgba(0,0,0,0.07)" : "none"; }}>

                        {/* Image */}
                        {item.imageUrl ? (
                          <div style={{ position: "relative", height: 176, overflow: "hidden" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl} alt={item.name} style={{
                              width: "100%", height: "100%", objectFit: "cover",
                              filter: soldOut ? "grayscale(80%)" : "none",
                              transition: "transform 0.3s",
                            }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
                            {item.price != null && (
                              <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem" }}>
                                <span style={{
                                  fontWeight: 800, fontSize: "0.9375rem",
                                  padding: "0.3rem 0.75rem", borderRadius: "0.625rem",
                                  background: soldOut ? "rgba(0,0,0,0.7)" : brand,
                                  color: soldOut ? "#9ca3af" : "#fff",
                                  textDecoration: soldOut ? "line-through" : "none",
                                  boxShadow: soldOut ? "none" : `0 4px 14px ${hexAlpha(brand, 0.55)}`,
                                }}>
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            )}
                            {soldOut && (
                              <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem" }}>
                                <span style={{
                                  fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.625rem",
                                  borderRadius: "0.375rem", background: "rgba(0,0,0,0.72)",
                                  color: "#d1d5db", border: "1px solid rgba(255,255,255,0.15)",
                                  textTransform: "uppercase", letterSpacing: "0.05em",
                                }}>
                                  {lang === "en" ? "Sold out" : "Esgotado"}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            height: 64, display: "flex", alignItems: "center", justifyContent: "center",
                            background: `linear-gradient(135deg, ${C.surface} 0%, ${hexAlpha(brand, 0.07)} 100%)`,
                          }}>
                            <UtensilsCrossed size={20} style={{ color: hexAlpha(brand, 0.3) }} />
                          </div>
                        )}

                        {/* Content */}
                        <div style={{ padding: "0.875rem 1rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.3,
                                color: soldOut ? C.textDim : C.text,
                                textDecoration: soldOut ? "line-through" : "none",
                              }}>
                                {item.name}
                              </p>
                              {item.description && (
                                <p style={{
                                  fontSize: "0.8125rem", marginTop: "0.3rem", lineHeight: 1.5,
                                  color: C.textMuted,
                                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                }}>
                                  {item.description}
                                </p>
                              )}
                              {item.tags.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
                                  {item.tags.map(tag => {
                                    const tc = TAG_COLORS[tag] ?? { bg: "#f3f4f6", color: "#6b7280" };
                                    return (
                                      <span key={tag} style={{
                                        fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.5rem",
                                        borderRadius: "999px", background: tc.bg, color: tc.color,
                                      }}>
                                        {tagName(tag, lang)}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            {/* Price without image */}
                            {!item.imageUrl && item.price != null && (
                              <p style={{
                                fontWeight: 800, fontSize: "1rem", flexShrink: 0,
                                color: soldOut ? C.textDim : brand,
                                textDecoration: soldOut ? "line-through" : "none",
                              }}>
                                {formatPrice(item.price)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        {hasPlan && (
          <div style={{ marginTop: "3rem" }}>
            <div style={{
              borderRadius: "1.25rem", overflow: "hidden",
              background: `linear-gradient(135deg, ${hexAlpha(brand, 0.08)} 0%, ${hexAlpha(brand, 0.18)} 100%)`,
              border: `1.5px solid ${hexAlpha(brand, 0.25)}`,
            }}>
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.875rem" }}>
                <p style={{ fontWeight: 800, fontSize: "1.0625rem", color: C.text }}>
                  {lang === "en" ? "Ready to visit?" : "Pronto para visitar?"}
                </p>
                <p style={{ fontSize: "0.875rem", color: C.textMuted, marginTop: "-0.375rem" }}>
                  {lang === "en"
                    ? "Book your table now and guarantee your spot."
                    : "Reserve sua mesa agora e garanta seu lugar."}
                </p>
                <a href={`/r/${restaurant.slug}`} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.75rem", borderRadius: "0.875rem",
                  background: brand, color: "#fff", fontWeight: 700, fontSize: "0.9375rem",
                  textDecoration: "none", boxShadow: `0 6px 20px ${hexAlpha(brand, 0.4)}`,
                }}>
                  <CalendarDays size={16} />
                  {lang === "en" ? "Make a reservation" : "Fazer uma reserva"}
                </a>
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: "0.75rem", color: C.textDim, marginTop: "1.5rem" }}>
              Powered by <span style={{ fontWeight: 700, color: brand, opacity: 0.7 }}>Reserva360</span>
            </p>
          </div>
        )}
      </main>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed", bottom: "1.5rem", right: "1.5rem",
            width: 48, height: 48, borderRadius: "0.875rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: brand, color: "#fff", border: "none", cursor: "pointer",
            boxShadow: `0 8px 24px ${hexAlpha(brand, 0.5)}`, zIndex: 20,
          }}>
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
}
