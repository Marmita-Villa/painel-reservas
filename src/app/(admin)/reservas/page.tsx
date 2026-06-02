import { CalendarDays, Filter, Plus } from "lucide-react";

export default function ReservasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Reservas
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            Gerencie todas as reservas do restaurante
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} />
          Nova Reserva
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <CalendarDays size={18} style={{ color: "var(--foreground-muted)" }} />
        <input
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        />
        <select
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          <option value="">Todos os status</option>
          <option>Confirmado</option>
          <option>Pendente</option>
          <option>Chegou</option>
          <option>Sentado</option>
          <option>Cancelado</option>
          <option>No-Show</option>
        </select>
        <select
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          <option value="">Todas as origens</option>
          <option>Interno</option>
          <option>Widget</option>
          <option>Google</option>
          <option>WhatsApp</option>
          <option>Instagram</option>
        </select>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm ml-auto"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground-muted)",
          }}
        >
          <Filter size={14} />
          Mais filtros
        </button>
      </div>

      <div
        className="rounded-xl border p-8 text-center"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <CalendarDays size={40} className="mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
        <p className="font-medium" style={{ color: "var(--foreground)" }}>
          Selecione uma data para ver as reservas
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          As reservas serão listadas aqui após conectar o banco de dados
        </p>
      </div>
    </div>
  );
}
