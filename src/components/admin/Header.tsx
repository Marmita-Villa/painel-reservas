"use client";

import { Bell, Search, Plus } from "lucide-react";
import { useReserva } from "./ReservaProvider";

export default function Header() {
  const { openModal } = useReserva();

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <header className="flex items-center gap-4 px-6 h-16 border-b flex-shrink-0"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
        <input type="text" placeholder="Buscar reserva ou cliente..."
          className="w-full pl-9 pr-4 py-2 text-sm"
          style={{ background: "var(--surface-2)", fontSize: "13px" }}
        />
      </div>

      <span className="text-xs capitalize hidden lg:block" style={{ color: "var(--foreground-muted)" }}>{today}</span>

      <div className="flex items-center gap-2 ml-auto">
        <button onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)", color: "var(--primary-fg)" }}>
          <Plus size={15} />
          Nova Reserva
        </button>

        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
        </button>

        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer"
          style={{ background: "var(--primary)", color: "var(--primary-fg)" }}>
          M
        </div>
      </div>
    </header>
  );
}
