"use client";

import { useState } from "react";
import { UtensilsCrossed, MapPin, Phone, ChevronRight, CalendarDays } from "lucide-react";

interface MenuItem {
  id: string; name: string; description?: string | null;
  price?: number | null; imageUrl?: string | null; tags: string[];
}
interface MenuCategory { id: string; name: string; items: MenuItem[]; }
interface Restaurant { name: string; slug: string; address?: string | null; phone?: string | null; logoUrl?: string | null; }

const C = {
  bg: "#f4f4f5", sur: "#ffffff", sur2: "#fafafa", bdr: "#e4e4e7",
  fg: "#18181b", muted: "#71717a", dim: "#a1a1aa",
  gold: "#f07316", goldL: "#fff7ed", goldB: "#fed7aa",
};

function formatPrice(p: number) {
  return `R$ ${p.toFixed(2).replace(".", ",")}`;
}

export default function CardapioPublicClient({
  restaurant, categories,
}: {
  restaurant: Restaurant;
  categories: MenuCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b shadow-sm" style={{ background: C.sur, borderColor: C.bdr }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
              style={{ background: C.gold, color: "#fff" }}>
              {restaurant.logoUrl
                ? <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover rounded-xl" />
                : restaurant.name[0]}
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight" style={{ color: C.fg }}>{restaurant.name}</h1>
              <p className="text-xs" style={{ color: C.muted }}>{totalItems} itens no cardápio</p>
            </div>
          </div>
          <a href={`/r/${restaurant.slug}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: C.gold, color: "#fff" }}>
            <CalendarDays size={13} /> Reservar
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {categories.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border" style={{ background: C.sur, borderColor: C.bdr }}>
            <UtensilsCrossed size={36} className="mx-auto mb-4 opacity-20" style={{ color: C.muted }} />
            <p className="font-semibold" style={{ color: C.fg }}>Cardápio em breve</p>
            <p className="text-sm mt-1" style={{ color: C.muted }}>O restaurante está montando o cardápio digital.</p>
          </div>
        ) : (
          <>
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: activeCategory === cat.id ? C.gold : C.sur,
                    color: activeCategory === cat.id ? "#fff" : C.muted,
                    border: `1px solid ${activeCategory === cat.id ? C.gold : C.bdr}`,
                  }}>
                  {cat.name}
                  <span className="ml-1.5 text-xs opacity-70">({cat.items.length})</span>
                </button>
              ))}
            </div>

            {/* Items */}
            {categories.filter(c => c.id === activeCategory).map(cat => (
              <div key={cat.id} className="space-y-3">
                <h2 className="text-lg font-bold" style={{ color: C.fg }}>{cat.name}</h2>
                {cat.items.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: C.muted }}>Nenhum item nesta categoria.</p>
                ) : (
                  cat.items.map(item => (
                    <div key={item.id} className="rounded-2xl border overflow-hidden flex"
                      style={{ background: C.sur, borderColor: C.bdr }}>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name}
                          className="w-28 h-28 object-cover flex-shrink-0" />
                      )}
                      <div className="p-4 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm leading-snug" style={{ color: C.fg }}>{item.name}</p>
                            {item.description && (
                              <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: C.muted }}>
                                {item.description}
                              </p>
                            )}
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.map(t => (
                                  <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ background: C.goldL, color: "#92400e", border: `1px solid ${C.goldB}` }}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {item.price != null && (
                            <p className="text-base font-bold flex-shrink-0" style={{ color: C.gold }}>
                              {formatPrice(item.price)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </>
        )}

        {/* Footer info */}
        <div className="rounded-2xl border p-5 space-y-2" style={{ background: C.sur, borderColor: C.bdr }}>
          {restaurant.address && (
            <div className="flex items-start gap-2 text-sm" style={{ color: C.muted }}>
              <MapPin size={14} style={{ color: C.gold, flexShrink: 0, marginTop: 2 }} /> {restaurant.address}
            </div>
          )}
          {restaurant.phone && (
            <div className="flex items-center gap-2 text-sm" style={{ color: C.muted }}>
              <Phone size={14} style={{ color: C.gold, flexShrink: 0 }} /> {restaurant.phone}
            </div>
          )}
          <a href={`/r/${restaurant.slug}`}
            className="flex items-center gap-2 mt-3 py-3 rounded-xl text-sm font-semibold justify-center transition-all hover:opacity-90"
            style={{ background: C.gold, color: "#fff" }}>
            <CalendarDays size={15} /> Fazer uma reserva <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
