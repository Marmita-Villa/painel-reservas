"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Clock, User, LogOut } from "lucide-react";

const ORANGE = "#f07316";
const DARK   = "#18181b";
const MUTED  = "#71717a";
const BORDER = "#e4e4e7";
const BG     = "#ffffff";

interface ContaNavProps { slug: string; }

export default function ContaNav({ slug }: ContaNavProps) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch("/api/cliente/auth/logout", { method: "POST" });
    router.push(`/r/${slug}/conta/login`);
  }

  const tabs = [
    { href: `/r/${slug}/conta/reservas`,  label: "Reservas",  icon: Calendar },
    { href: `/r/${slug}/conta/historico`, label: "Histórico", icon: Clock },
    { href: `/r/${slug}/conta/perfil`,    label: "Perfil",    icon: User },
  ];

  return (
    <nav style={{ background: BG, borderBottom: `1px solid ${BORDER}`, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>

          {/* Logo — fundo branco, encaixa naturalmente */}
          <Link href={`/r/${slug}`} style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0, padding: "8px 0" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Reserva360" style={{ height: 72, objectFit: "contain" }} />
          </Link>

          {/* Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.125rem" }}>
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.9rem 0.875rem",
                  fontSize: "0.875rem", fontWeight: active ? 600 : 400,
                  color: active ? ORANGE : MUTED,
                  borderBottom: active ? `2px solid ${ORANGE}` : "2px solid transparent",
                  textDecoration: "none", whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}>
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            color: MUTED, fontSize: "0.8125rem",
            background: "none", border: "none", cursor: "pointer",
            padding: "0.9rem 0", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
