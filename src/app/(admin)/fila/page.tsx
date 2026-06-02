import { Clock, Plus, Users, Phone, Bell } from "lucide-react";

const waitlist = [
  { id: 1, name: "Bruno Ferreira", phone: "(11) 99999-1234", party: 3, wait: 15, status: "WAITING" },
  { id: 2, name: "Camila Rocha", phone: "(21) 98888-5678", party: 2, wait: 30, status: "WAITING" },
  { id: 3, name: "Diego Martins", phone: "(11) 97777-9012", party: 5, wait: 45, status: "CALLED" },
  { id: 4, name: "Elena Castro", phone: "(31) 96666-3456", party: 2, wait: 55, status: "WAITING" },
];

const statusStyle: Record<string, { label: string; bg: string; color: string }> = {
  WAITING: { label: "Aguardando", bg: "var(--warning)20", color: "var(--warning)" },
  CALLED: { label: "Chamado", bg: "var(--info)20", color: "var(--info)" },
  SEATED: { label: "Sentado", bg: "var(--success)20", color: "var(--success)" },
};

export default function FilaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Fila de Espera
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            {waitlist.length} pessoas aguardando · Espera média: ~35 min
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} />
          Adicionar à Fila
        </button>
      </div>

      <div className="grid gap-3">
        {waitlist.map((entry, i) => {
          const s = statusStyle[entry.status];
          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}
              >
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                    {entry.name}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <Phone size={12} style={{ color: "var(--foreground-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {entry.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={12} style={{ color: "var(--foreground-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {entry.party} pessoa{entry.party > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} style={{ color: "var(--foreground-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      ~{entry.wait} min de espera
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "var(--info)20", color: "var(--info)" }}
                >
                  <Bell size={12} />
                  Chamar
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "var(--success)20", color: "var(--success)" }}
                >
                  <Users size={12} />
                  Sentar
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "var(--danger)20", color: "var(--danger)" }}
                >
                  Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
