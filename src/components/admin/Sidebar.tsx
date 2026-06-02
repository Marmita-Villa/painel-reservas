"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Clock,
  Map,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reservas", label: "Reservas", icon: CalendarDays },
  { href: "/fila", label: "Fila de Espera", icon: Clock },
  { href: "/mesas", label: "Mesas", icon: Map },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col transition-all duration-300 border-r",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
          style={{ background: "var(--primary)" }}
        >
          R
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            Reservas Pro
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "text-white"
                  : "hover:opacity-80"
              )}
              style={{
                background: active ? "var(--primary)" : "transparent",
                color: active ? "white" : "var(--foreground-muted)",
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-4 border-t transition-opacity hover:opacity-70"
        style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}
      >
        <ChevronLeft
          size={18}
          className={cn("transition-transform", collapsed && "rotate-180")}
        />
      </button>
    </aside>
  );
}
