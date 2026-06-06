"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Phone, CalendarDays, Search, X, ChevronUp, UtensilsCrossed } from "lucide-react";
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
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  // Collect all unique tags across all items
  const allTags = Array.from(
    new Set(categories.flatMap(c => c.items.flatMap(i => i.tags)))
  );

  // Filter pipeline: search → tag
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

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);

  function scrollToCategory(id: string) {
    setActiveCategory(id);
    categoryRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const el = document.getElementById("menu-scroll");
    if (!el) return;
    const handler = () => setShowBackToTop(el.scrollTop > 300);
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#111113", color: "#f4f4f5" }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 border-b"
        style={{ background: "#18181b", borderColor: "#27272a" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo / Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 overflow-hidden"
              style={{ background: brand, color: "#fff" }}>
              {restaurant.logoUrl
                ? <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                : restaurant.name[0]}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate" style={{ color: "#fafafa" }}>
                {restaurant.name}
              </h1>
              <p className="text-xs" style={{ color: "#71717a" }}>
                {lang === "en" ? "Digital Menu" : "Cardápio Digital"} · {totalItems} {lang === "en" ? "items" : "itens"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <LangToggle lang={lang} setLang={setLang}
              style={{ borderColor: "#3f3f46" }} />
            <a href={`/r/${restaurant.slug}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: brand, color: "#fff" }}>
              <CalendarDays size={13} /> {lang === "en" ? "Reserve" : "Reservar"}
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#71717a" }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === "en" ? "Search dishes..." : "Buscar pratos..."}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#27272a", border: "1px solid #3f3f46", color: "#fafafa" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} style={{ color: "#71717a" }} />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-1 overflow-x-auto px-4 pb-3 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => scrollToCategory(cat.id)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: activeCategory === cat.id ? brand : "#27272a",
                    color: activeCategory === cat.id ? "#fff" : "#a1a1aa",
                    border: `1px solid ${activeCategory === cat.id ? brand : "#3f3f46"}`,
                  }}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tag filter chips — only shown when there are tags */}
        {allTags.length > 0 && (
          <div className="max-w-3xl mx-auto border-t" style={{ borderColor: "#27272a" }}>
            <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 scrollbar-hide items-center">
              <span className="text-xs flex-shrink-0" style={{ color: "#52525b" }}>
                {lang === "en" ? "Filter:" : "Filtrar:"}
              </span>
              <button
                onClick={() => setActiveTag(null)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: activeTag === null ? brand : "#27272a",
                  color: activeTag === null ? "#fff" : "#a1a1aa",
                  border: `1px solid ${activeTag === null ? brand : "#3f3f46"}`,
                }}>
                {lang === "en" ? "All" : "Todos"}
              </button>
              {allTags.map(tag => (
                <button key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                  style={{
                    background: activeTag === tag ? brand : "#27272a",
                    color: activeTag === tag ? "#fff" : "#a1a1aa",
                    border: `1px solid ${activeTag === tag ? brand : "#3f3f46"}`,
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
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-10">

          {!hasPlan ? (
            <div className="py-20 text-center space-y-3">
              <UtensilsCrossed size={40} className="mx-auto opacity-20" style={{ color: "#71717a" }} />
              <p className="font-semibold" style={{ color: "#a1a1aa" }}>
                {lang === "en" ? "Menu not available" : "Cardápio não disponível"}
              </p>
              <p className="text-sm" style={{ color: "#71717a" }}>
                {lang === "en"
                  ? "The restaurant hasn't published their menu yet."
                  : "O restaurante ainda não publicou o cardápio."}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Search size={32} className="mx-auto opacity-20" style={{ color: "#71717a" }} />
              <p style={{ color: "#a1a1aa" }}>
                {lang === "en" ? "No dishes found" : "Nenhum prato encontrado"}
              </p>
            </div>
          ) : (
            filtered.map(cat => (
              <section key={cat.id} ref={el => { categoryRefs.current[cat.id] = el; }}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-xl font-bold" style={{ color: "#fafafa" }}>{cat.name}</h2>
                  <div className="flex-1 h-px" style={{ background: "#27272a" }} />
                  <span className="text-xs" style={{ color: "#52525b" }}>{cat.items.length}</span>
                </div>

                <div className="space-y-3">
                  {cat.items.map(item => {
                    const soldOut = item.isSoldOut === true;
                    return (
                      <div key={item.id}
                        className="flex gap-4 rounded-2xl overflow-hidden transition-all hover:opacity-90 relative"
                        style={{
                          background: "#18181b",
                          border: `1px solid ${soldOut ? "#3f3f46" : "#27272a"}`,
                          opacity: soldOut ? 0.65 : 1,
                        }}>

                        {/* Esgotado ribbon */}
                        {soldOut && (
                          <div className="absolute top-0 right-0 z-10">
                            <span className="block px-2.5 py-0.5 text-xs font-bold rounded-bl-xl rounded-tr-2xl"
                              style={{ background: "#3f3f46", color: "#a1a1aa", letterSpacing: "0.05em" }}>
                              {lang === "en" ? "SOLD OUT" : "ESGOTADO"}
                            </span>
                          </div>
                        )}

                        {/* Image */}
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name}
                            className="w-28 h-28 sm:w-32 sm:h-32 object-cover flex-shrink-0"
                            style={{ filter: soldOut ? "grayscale(100%)" : "none" }} />
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center self-center ml-4"
                            style={{ opacity: 0.15 }}>
                            <UtensilsCrossed size={28} style={{ color: brand }} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 py-4 pr-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base leading-snug"
                                style={{
                                  color: soldOut ? "#71717a" : "#fafafa",
                                  textDecoration: soldOut ? "line-through" : "none",
                                }}>
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2" style={{ color: "#71717a" }}>
                                  {item.description}
                                </p>
                              )}
                              {item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                                </div>
                              )}
                            </div>
                            {item.price != null && (
                              <p className="text-base sm:text-lg font-bold flex-shrink-0"
                                style={{
                                  color: soldOut ? "#52525b" : brand,
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
            ))
          )}

          {/* Footer */}
          <footer className="pt-6 pb-10 border-t space-y-4" style={{ borderColor: "#27272a" }}>
            {restaurant.address && (
              <div className="flex items-start gap-2 text-sm" style={{ color: "#71717a" }}>
                <MapPin size={14} style={{ color: brand, flexShrink: 0, marginTop: 2 }} />
                {restaurant.address}
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "#71717a" }}>
                <Phone size={14} style={{ color: brand, flexShrink: 0 }} />
                {restaurant.phone}
              </div>
            )}
            <a href={`/r/${restaurant.slug}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: brand, color: "#fff" }}>
              <CalendarDays size={16} />
              {lang === "en" ? "Make a reservation" : "Fazer uma reserva"}
            </a>
            <p className="text-center text-xs" style={{ color: "#3f3f46" }}>
              Powered by Réservé
            </p>
          </footer>
        </div>
      </main>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => document.getElementById("menu-scroll")?.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:opacity-80 z-20"
          style={{ background: brand, color: "#fff" }}>
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
}
