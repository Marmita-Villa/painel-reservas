"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type TableStatus = "free" | "reserved" | "occupied" | "blocked";

const tables = [
  { id: 1, name: "M1", capacity: 2, x: 1, y: 1, status: "free" as TableStatus },
  { id: 2, name: "M2", capacity: 4, x: 2, y: 1, status: "occupied" as TableStatus },
  { id: 3, name: "M3", capacity: 2, x: 3, y: 1, status: "reserved" as TableStatus },
  { id: 4, name: "M4", capacity: 6, x: 1, y: 2, status: "free" as TableStatus },
  { id: 5, name: "M5", capacity: 4, x: 2, y: 2, status: "occupied" as TableStatus },
  { id: 6, name: "M6", capacity: 4, x: 3, y: 2, status: "free" as TableStatus },
  { id: 7, name: "M7", capacity: 8, x: 1, y: 3, status: "reserved" as TableStatus },
  { id: 8, name: "M8", capacity: 2, x: 2, y: 3, status: "blocked" as TableStatus },
  { id: 9, name: "M9", capacity: 4, x: 3, y: 3, status: "free" as TableStatus },
];

const statusConfig: Record<TableStatus, { label: string; bg: string; border: string; text: string }> = {
  free: { label: "Livre", bg: "#22c55e15", border: "#22c55e60", text: "var(--success)" },
  reserved: { label: "Reservada", bg: "#3b82f615", border: "#3b82f660", text: "var(--info)" },
  occupied: { label: "Ocupada", bg: "#ef444415", border: "#ef444460", text: "var(--danger)" },
  blocked: { label: "Bloqueada", bg: "#8b90a715", border: "#8b90a760", text: "var(--foreground-muted)" },
};

export default function MesasPage() {
  const [selected, setSelected] = useState<number | null>(null);

  const summary = {
    free: tables.filter((t) => t.status === "free").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    blocked: tables.filter((t) => t.status === "blocked").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Mesas
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            Mapa visual do salão em tempo real
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} />
          Nova Mesa
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        {(Object.entries(statusConfig) as [TableStatus, typeof statusConfig[TableStatus]][]).map(
          ([key, val]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm border"
                style={{ background: val.bg, borderColor: val.border }}
              />
              <span style={{ color: "var(--foreground-muted)" }}>
                {val.label} ({summary[key]})
              </span>
            </div>
          )
        )}
      </div>

      {/* Floor map */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(3, minmax(120px, 160px))" }}
        >
          {tables.map((table) => {
            const s = statusConfig[table.status];
            const isSelected = selected === table.id;
            return (
              <button
                key={table.id}
                onClick={() => setSelected(isSelected ? null : table.id)}
                className={cn(
                  "rounded-xl p-4 border-2 transition-all text-left cursor-pointer",
                  isSelected && "scale-105 shadow-lg"
                )}
                style={{
                  background: isSelected ? s.bg : s.bg,
                  borderColor: isSelected ? s.text : s.border,
                  boxShadow: isSelected ? `0 0 0 2px ${s.text}` : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base" style={{ color: "var(--foreground)" }}>
                    {table.name}
                  </span>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ color: s.text }}>
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={12} style={{ color: "var(--foreground-muted)" }} />
                  <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    até {table.capacity} pessoas
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected table detail */}
      {selected && (() => {
        const t = tables.find((t) => t.id === selected)!;
        const s = statusConfig[t.status];
        return (
          <div
            className="rounded-xl border p-5"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h3 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>
              {t.name} — {s.label}
            </h3>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--success)20", color: "var(--success)" }}
              >
                Marcar como Livre
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--primary)20", color: "var(--primary)" }}
              >
                Nova Reserva nesta Mesa
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--danger)20", color: "var(--danger)" }}
              >
                Bloquear
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
