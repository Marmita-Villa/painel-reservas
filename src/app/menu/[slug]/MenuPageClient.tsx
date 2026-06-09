"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Phone, CalendarDays, Search, X, ChevronUp, UtensilsCrossed, Clock, Star } from "lucide-react";
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
  phone?: string | null; logoUrl?: string | null; plan: string;
  primaryColor?: string | null;
}

function formatPrice(p: number) {
  return `R$ ${p.toFixed(2).replace(".", ",")}`;
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  "Vegetariano 🥦": { bg: "#dcfce7", color: "#16a34a" },
  "Vegan 🌱":        { bg: "#d1fae5", color: "#059669" },
  "Vegano 🌱":       { bg: "#d1fae5", color: "#059669" },
  "Sem glúten 🌾":   { bg: "#fef9c3", color: "#ca8a04" },
  "Sem lactose 🥛":  { bg: "#e0f2fe", color: "#0284c7" },
  "Picante 🌶️":      { bg: "#fee2e2", color: "#dc2626" },
  "Novidade ✨":     { bg: "#ede9fe", color: "#7c3aed" },
  "Mais pedido ⭐":  { bg: "#fff7ed", color: "#ea580c" },
};

function TagBadge({ tag }: { tag: string }) {
  const style = TAG_COLORS[tag] ?? { bg: "#f4f4f5", color: "#71717a" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: style.bg, color: style.color }}>
      {tag}
    </span>
  );
}

// Hex → rgba helper for transparent overlays
function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollingRef = useRef(false);

  const allTags = Array.from(new Set(categories.flatMap(c => c.items.flatMap(i => i.tags))));
  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);

  const filtered = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      const matchSearch = !search.trim() || search.trim().length < 2 ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
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

  // IntersectionObserver to track active category while scrolling
  useEffect(() => {
    if (categories.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (scrollingRef.current) return;
        // pick the topmost visible section
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
    <div className="min-h-screen flex flex-col" style={{ background: "#0c0c0e", color: "#f4f4f5" }}>

      {/* ── HERO ── */}
      {!search && (
        <div className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #0c0c0e 0%, ${hexAlpha(brand, 0.25)} 60%, ${hexAlpha(brand, 0.45)} 100%)`,
            borderBottom: `1px solid ${hexAlpha(brand, 0.3)}`,
          }}>
          {/* decorative glow */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: hexAlpha(brand, 0.12), filter: "blur(60px)" }} />

          <div className="max-w-3xl mx-auto px-5 pt-8 pb-6 relative z-10">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 overflow-hidden shadow-lg"
                style={{ background: brand, color: "#fff", boxShadow: `0 8px 24px ${hexAlpha(brand, 0.4)}` }}>
                {restaurant.logoUrl
                  ? <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                  : restaurant.name[0]}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: hexAlpha(brand, 0.2), color: brand, border: `1px solid ${hexAlpha(brand, 0.4)}` }}>
                    {lang === "en" ? "Digital Menu" : "Cardápio Digital"}
                  </span>
                </div>
                <h1 className="text-2xl font-black leading-tight" style={{ color: "#fafafa" }}>
                  {restaurant.name}
                </h1>
                <div className="flex flex-wrap gap-3 mt-2">
                  {restaurant.address && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#a1a1aa" }}>
                      <MapPin size={11} style={{ color: brand }} /> {restaurant.address}
                    </span>
                  )}
                  {restaurant.phone && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#a1a1aa" }}>
                      <Phone size={11} style={{ color: brand }} /> {restaurant.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#a1a1aa" }}>
                    <UtensilsCrossed size={11} style={{ color: brand }} />
                    {totalItems} {lang === "en" ? "items" : "itens"} · {categories.length} {lang === "en" ? "categories" : "categorias"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <LangToggle lang={lang} setLang={setLang} />
                <a href={`/r/${restaurant.slug}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ background: brand, color: "#fff", boxShadow: `0 4px 16px ${hexAlpha(brand, 0.4)}` }}>
                  <CalendarDays size={12} />
                  {lang === "en" ? "Reserve a table" : "Fazer reserva"}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY HEADER (search + categories + tag filters) ── */}
      <header id="sticky-header" className="sticky top-0 z-30 transition-all"
        style={{
          background: headerScrolled ? "rgba(12,12,14,0.97)" : "#18181b",
          borderBottom: `1px solid ${headerScrolled ? hexAlpha(brand, 0.2) : "#27272a"}`,
          backdropFilter: "blur(12px)",
        }}>

        {/* Search */}
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === "en" ? "Search dishes..." : "Buscar pratos..."}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#1c1c1f", border: `1px solid ${search ? brand : "#3f3f46"}`, color: "#fafafa",
                  boxShadow: search ? `0 0 0 2px ${hexAlpha(brand, 0.15)}` : "none" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={14} style={{ color: "#71717a" }} />
                </button>
              )}
            </div>
            {search && (
              <a href={`/r/${restaurant.slug}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: brand, color: "#fff" }}>
                <CalendarDays size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => scrollToCategory(cat.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: activeCategory === cat.id ? brand : "#1c1c1f",
                    color: activeCategory === cat.id ? "#fff" : "#71717a",
                    border: `1px solid ${activeCategory === cat.id ? brand : "#3f3f46"}`,
                    boxShadow: activeCategory === cat.id ? `0 2px 12px ${hexAlpha(brand, 0.35)}` : "none",
                  }}>
                  {cat.name}
                  <span className="text-xs opacity-70 font-normal">
                    {cat.items.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tag filters */}
        {allTags.length > 0 && !search && (
          <div className="max-w-3xl mx-auto border-t" style={{ borderColor: "#1c1c1f" }}>
            <div className="flex gap-1.5 overflow-x-auto px-4 py-2 scrollbar-hide items-center">
              <span className="text-xs flex-shrink-0 font-medium" style={{ color: "#3f3f46" }}>
                {lang === "en" ? "Filter" : "Filtrar"}
              </span>
              <button onClick={() => setActiveTag(null)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: activeTag === null ? brand : "transparent",
                  color: activeTag === null ? "#fff" : "#52525b",
                  border: `1px solid ${activeTag === null ? brand : "#2a2a2d"}`,
                }}>
                {lang === "en" ? "All" : "Todos"}
              </button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: activeTag === tag ? brand : "transparent",
                    color: activeTag === tag ? "#fff" : "#52525b",
                    border: `1px solid ${activeTag === tag ? brand : "#2a2a2d"}`,
                  }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── CONTENT ── */}
      <main id="menu-scroll" className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-12">

          {!hasPlan ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "#1c1c1f" }}>
                <UtensilsCrossed size={32} style={{ color: "#3f3f46" }} />
              </div>
              <p className="font-semibold text-lg" style={{ color: "#a1a1aa" }}>
                {lang === "en" ? "Menu not available" : "Cardápio não disponível"}
              </p>
              <p className="text-sm max-w-xs mx-auto" style={{ color: "#52525b" }}>
                {lang === "en"
                  ? "The restaurant hasn't published their menu yet."
                  : "O restaurante ainda não publicou o cardápio."}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "#1c1c1f" }}>
                <Search size={28} style={{ color: "#3f3f46" }} />
              </div>
              <p className="font-semibold" style={{ color: "#a1a1aa" }}>
                {lang === "en" ? "No dishes found" : "Nenhum prato encontrado"}
              </p>
              <button onClick={() => { setSearch(""); setActiveTag(null); }}
                className="text-xs px-4 py-2 rounded-full transition-all hover:opacity-80"
                style={{ background: hexAlpha(brand, 0.15), color: brand, border: `1px solid ${hexAlpha(brand, 0.3)}` }}>
                {lang === "en" ? "Clear filters" : "Limpar filtros"}
              </button>
            </div>
          ) : (
            filtered.map(cat => (
              <section key={cat.id}
                ref={el => { categoryRefs.current[cat.id] = el; }}
                data-cat-id={cat.id}>

                {/* Category header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: brand }} />
                  <h2 className="text-lg font-black tracking-tight" style={{ color: "#fafafa" }}>{cat.name}</h2>
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #27272a, transparent)" }} />
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "#1c1c1f", color: "#52525b", border: "1px solid #27272a" }}>
                    {cat.items.length}
                  </span>
                </div>

                {/* Items grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {cat.items.map(item => {
                    const soldOut = item.isSoldOut === true;
                    return (
                      <div key={item.id}
                        className="group relative rounded-2xl overflow-hidden transition-all duration-200"
                        style={{
                          background: "#141416",
                          border: `1px solid ${soldOut ? "#27272a" : "#222224"}`,
                          opacity: soldOut ? 0.6 : 1,
                        }}>

                        {/* Image area */}
                        {item.imageUrl ? (
                          <div className="relative h-44 overflow-hidden">
                            <img src={item.imageUrl} alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              style={{ filter: soldOut ? "grayscale(100%)" : "none" }} />
                            {/* gradient overlay */}
                            <div className="absolute inset-0"
                              style={{ background: "linear-gradient(to top, rgba(20,20,22,0.8) 0%, transparent 60%)" }} />
                            {/* price badge on image */}
                            {item.price != null && (
                              <div className="absolute bottom-3 right-3">
                                <span className="text-sm font-black px-2.5 py-1 rounded-xl"
                                  style={{
                                    background: soldOut ? "#27272a" : brand,
                                    color: soldOut ? "#71717a" : "#fff",
                                    textDecoration: soldOut ? "line-through" : "none",
                                    boxShadow: soldOut ? "none" : `0 4px 12px ${hexAlpha(brand, 0.5)}`,
                                  }}>
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            )}
                            {/* sold out ribbon */}
                            {soldOut && (
                              <div className="absolute top-3 left-3">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                                  style={{ background: "rgba(0,0,0,0.75)", color: "#a1a1aa", border: "1px solid #3f3f46" }}>
                                  {lang === "en" ? "SOLD OUT" : "ESGOTADO"}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* No image: elegant placeholder with gradient */
                          <div className="h-20 flex items-center justify-center relative overflow-hidden"
                            style={{ background: `linear-gradient(135deg, #18181b 0%, ${hexAlpha(brand, 0.08)} 100%)` }}>
                            <UtensilsCrossed size={22} style={{ color: hexAlpha(brand, 0.25) }} />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-snug"
                                style={{
                                  color: soldOut ? "#52525b" : "#fafafa",
                                  textDecoration: soldOut ? "line-through" : "none",
                                }}>
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: "#52525b" }}>
                                  {item.description}
                                </p>
                              )}
                              {item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                                </div>
                              )}
                            </div>
                            {/* Price shown here when no image */}
                            {!item.imageUrl && item.price != null && (
                              <p className="text-base font-black flex-shrink-0 ml-2"
                                style={{
                                  color: soldOut ? "#3f3f46" : brand,
                                  textDecoration: soldOut ? "line-through" : "none",
                                }}>
                                {formatPrice(item.price)}
                              </p>
                            )}
                          </div>

                          {/* Sold out label for no-image items */}
                          {soldOut && !item.imageUrl && (
                            <div className="mt-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                                style={{ background: "#1c1c1f", color: "#52525b", border: "1px solid #27272a" }}>
                                {lang === "en" ? "Sold out" : "Esgotado"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          {/* Footer CTA */}
          {hasPlan && (
            <div className="pt-4 pb-10 space-y-4">
              <div className="rounded-2xl overflow-hidden"
                style={{ background: `linear-gradient(135deg, #141416 0%, ${hexAlpha(brand, 0.15)} 100%)`, border: `1px solid ${hexAlpha(brand, 0.25)}` }}>
                <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-black text-base" style={{ color: "#fafafa" }}>
                      {lang === "en" ? "Ready to visit?" : "Pronto para visitar?"}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>
                      {lang === "en"
                        ? "Book your table now and guarantee your spot."
                        : "Reserve sua mesa agora e garanta seu lugar."}
                    </p>
                  </div>
                  <a href={`/r/${restaurant.slug}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 whitespace-nowrap flex-shrink-0"
                    style={{ background: brand, color: "#fff", boxShadow: `0 4px 20px ${hexAlpha(brand, 0.45)}` }}>
                    <CalendarDays size={16} />
                    {lang === "en" ? "Make a reservation" : "Fazer uma reserva"}
                  </a>
                </div>
              </div>

              <p className="text-center text-xs" style={{ color: "#27272a" }}>
                Powered by <span style={{ color: "#3f3f46" }}>Réservé</span>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:opacity-80 z-20"
          style={{ background: brand, color: "#fff", boxShadow: `0 8px 24px ${hexAlpha(brand, 0.45)}` }}>
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
}
