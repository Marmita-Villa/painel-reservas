"use client";

import { Bell, Plus, LogOut, ChevronDown } from "lucide-react";
import { useReserva } from "./ReservaProvider";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Header() {
  const { openModal } = useReserva();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = session?.user?.name
    ?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <header className="flex items-center gap-4 px-6 h-16 border-b flex-shrink-0"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

      <div className="flex-1 max-w-sm relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: "var(--foreground-muted)" }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
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

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "var(--surface-2)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: "var(--primary)", color: "var(--primary-fg)" }}>
              {initials}
            </div>
            <span className="text-xs font-medium hidden sm:block max-w-[100px] truncate"
              style={{ color: "var(--foreground)" }}>
              {session?.user?.name?.split(" ")[0] ?? "Usuário"}
            </span>
            <ChevronDown size={13} style={{ color: "var(--foreground-muted)" }} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl z-20 py-1 overflow-hidden"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{session?.user?.name}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--foreground-muted)" }}>{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--danger)" }}>
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
