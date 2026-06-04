"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User, LogOut } from "lucide-react";

const C = {
  bg: "#ffffff",
  bdr: "#e4e4e7",
  fg: "#18181b",
  muted: "#71717a",
  gold: "#f07316",
  goldL: "#fff7ed",
};

interface ContaNavProps {
  slug: string;
}

export default function ContaNav({ slug }: ContaNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/cliente/auth/logout", { method: "POST" });
    router.push(`/r/${slug}/conta/login`);
  }

  const tabs = [
    { href: `/r/${slug}/conta/reservas`, label: "Reservas", icon: Calendar },
    { href: `/r/${slug}/conta/historico`, label: "Histórico", icon: Clock },
    { href: `/r/${slug}/conta/perfil`, label: "Perfil", icon: User },
  ];

  return (
    <nav style={{ background: C.bg, borderBottom: `1px solid ${C.bdr}`, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", overflowX: "auto" }}>
          <Link href={`/r/${slug}`} style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: C.muted, fontSize: "0.8125rem", textDecoration: "none", whiteSpace: "nowrap", padding: "0.875rem 0", flexShrink: 0 }}>
            <ArrowLeft size={14} />
            Nova reserva
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.875rem 0.75rem",
                    fontSize: "0.875rem", fontWeight: active ? 600 : 400,
                    color: active ? C.gold : C.muted,
                    borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
                    textDecoration: "none", whiteSpace: "nowrap",
                    transition: "color 0.15s",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>

          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: C.muted, fontSize: "0.8125rem", background: "none", border: "none", cursor: "pointer", padding: "0.875rem 0", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
