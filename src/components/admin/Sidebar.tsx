"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Clock, Map, BarChart3, Settings, PanelLeftClose, PanelLeftOpen, UserCog, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useSession } from "next-auth/react";

const allNavItems = [
  { href: "/dashboard",     label: "Dashboard",      icon: LayoutDashboard, roles: ["MASTER_SUPER", "ADMIN", "GERENTE", "USUARIO"] },
  { href: "/reservas",      label: "Reservas",       icon: CalendarDays,    roles: ["MASTER_SUPER", "ADMIN", "GERENTE", "USUARIO"] },
  { href: "/fila",          label: "Fila de Espera", icon: Clock,           roles: ["MASTER_SUPER", "ADMIN", "GERENTE", "USUARIO"] },
  { href: "/mesas",         label: "Mesas",          icon: Map,             roles: ["MASTER_SUPER", "ADMIN", "GERENTE"] },
  { href: "/clientes",      label: "Clientes",       icon: Users,           roles: ["MASTER_SUPER", "ADMIN", "GERENTE"] },
  { href: "/relatorios",    label: "Relatórios",     icon: BarChart3,       roles: ["MASTER_SUPER", "ADMIN", "GERENTE"] },
  { href: "/configuracoes", label: "Configurações",  icon: Settings,        roles: ["MASTER_SUPER", "ADMIN"] },
  { href: "/usuarios",      label: "Usuários",       icon: UserCog,         roles: ["MASTER_SUPER", "ADMIN"] },
  { href: "/restaurantes",  label: "Restaurantes",   icon: Store,           roles: ["MASTER_SUPER"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "USUARIO";

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <aside
      className={cn("flex flex-col flex-shrink-0 transition-all duration-300 border-r", collapsed ? "w-[60px]" : "w-[220px]")}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-3 h-16 border-b" style={{ borderColor: "var(--border)" }}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: "var(--primary)", color: "#fff" }}>
            R
          </div>
        ) : (
          <Image src="/logo.png" alt="Reserva360" width={160} height={48} style={{ objectFit: "contain", maxHeight: "48px" }} priority />
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
