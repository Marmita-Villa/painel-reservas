"use client";

import { Bell, Search, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useReserva } from "./ReservaProvider";

export default function Header() {
  const { openModal } = useReserva();

  const today = formatDate(new Date(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className="flex items-center gap-4 px-6 py-4 border-b"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--foreground-muted)" }}
        />
        <input
          type="text"
          placeholder="Buscar reserva, cliente..."
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-all"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>

      <span className="text-sm capitalize hidden md:block" style={{ color: "var(--foreground-muted)" }}>
        {today}
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} />
          <span className="hidden sm:block">Nova Reserva</span>
        </button>

        <button
          className="relative p-2 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: "var(--foreground-muted)" }}
        >
          <Bell size={20} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: "var(--primary)" }}
          />
        </button>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white cursor-pointer"
          style={{ background: "var(--primary)" }}
        >
          A
        </div>
      </div>
    </header>
  );
}
