"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Clock, User, LogOut } from "lucide-react";

const NAVY = "#0f1729";
const ORANGE = "#f07316";
const WHITE = "#ffffff";
const MUTED = "rgba(255,255,255,0.55)";

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
    <nav style={{
      background: NAVY,
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>

          {/* Logo — sem fundo extra, funde com o nav */}
          <Link href={`/r/${slug}`} style={{
            display: "flex", alignItems: "center",
            textDecoration: "none", flexShrink: 0,
            padding: "10px 0",
          }}>
            <img src="/logo.png" alt="Reserva360" style={{ height: 68, objectFit: "contain" }} />
          </Link>

          {/* Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.125rem" }}>
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.875rem 0.875rem",
                    fontSize: "0.875rem", fontWeight: active ? 600 : 400,
                    color: active ? ORANGE : MUTED,
                    borderBottom: active ? `2px solid ${ORANGE}` : "2px solid transparent",
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

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              color: MUTED, fontSize: "0.8125rem",
              background: "none", border: "none", cursor: "pointer",
              padding: "0.875rem 0", whiteSpace: "nowrap", flexShrink: 0,
              transition: "color 0.15s",
            }}
          >
            <LogOut size={14} />
            Sair
          </button>

        </div>
      </div>
    </nav>
  );
}
