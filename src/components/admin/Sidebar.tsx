"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Clock, Map, BarChart3, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { href: "/reservas",      label: "Reservas",       icon: CalendarDays },
  { href: "/fila",          label: "Fila de Espera", icon: Clock },
  { href: "/mesas",         label: "Mesas",          icon: Map },
  { href: "/clientes",      label: "Clientes",       icon: Users },
  { href: "/relatorios",    label: "Relatórios",     icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações",  icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn("flex flex-col flex-shrink-0 transition-all duration-300 border-r", collapsed ? "w-[60px]" : "w-[220px]")}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm"
          style={{ background: "var(--primary)", color: "#fff" }}>
          R
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: "var(--foreground)" }}>Reservas Pro</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-dim)" }}>Gestão de Mesas</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all")}
              style={{
                background: active ? "var(--primary-light)" : "transparent",
                color: active ? "var(--primary)" : "var(--foreground-muted)",
                fontWeight: active ? 600 : 400,
              }}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t transition-opacity hover:opacity-60"
        style={{ borderColor: "var(--border)", color: "var(--foreground-dim)" }}>
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>
    </aside>
  );
}
