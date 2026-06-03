"use client";

import { Bell, Plus, LogOut, ChevronDown, Search } from "lucide-react";
import { useReserva } from "./ReservaProvider";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const roleBadge: Record<string, { label: string; bg: string }> = {
  MASTER_SUPER: { label: "Master",  bg: "#7c3aed" },
  ADMIN:        { label: "Admin",   bg: "#2563eb" },
  GERENTE:      { label: "Gerente", bg: "#16a34a" },
  USUARIO:      { label: "Usuário", bg: "#71717a" },
};

export default function Header() {
  const { openModal } = useReserva();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = (session?.user as any)?.role ?? "USUARIO";
  const badge = roleBadge[role] ?? roleBadge.USUARIO;

  const initials = session?.user?.name
    ?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <header className="flex items-center gap-4 px-6 h-16 border-b flex-shrink-0"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-dim)" }} />
        <input type="text" placeholder="Buscar reserva ou cliente..."
          className="w-full pl-9 pr-4 py-2 text-sm"
          style={{ background: "var(--surface-3)", fontSize: "13px" }}
        />
      </div>

      <span className="text-xs capitalize hidden lg:block" style={{ color: "var(--foreground-dim)" }}>{today}</span>

      <div className="flex items-center gap-2 ml-auto">
        {/* Nova Reserva */}
        <button onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 shadow-sm"
          style={{ background: "var(--primary)", color: "#fff" }}>
          <Plus size={15} />
          Nova Reserva
        </button>

        {/* Notificações */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-gray-100"
          style={{ color: "var(--foreground-muted)", border: "1px solid var(--border)" }}>
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all hover:bg-gray-50 border"
            style={{ borderColor: "var(--border)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--primary)", color: "#fff" }}>
              {initials}
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {session?.user?.name?.split(" ")[0] ?? "Usuário"}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                style={{ background: badge.bg, color: "#fff" }}>
                {badge.label}
              </span>
            </div>
            <ChevronDown size={13} style={{ color: "var(--foreground-dim)" }} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-lg z-20 py-1 overflow-hidden"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{session?.user?.name}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--foreground-muted)" }}>{session?.user?.email}</p>
                </div>
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-red-50"
                  style={{ color: "var(--danger)" }}>
                  <LogOut size={14} />
                  Sair da conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
