import { Users, Search, Star, AlertTriangle } from "lucide-react";

const customers = [
  { name: "João Silva", phone: "(11) 99999-1234", email: "joao@email.com", visits: 12, noShows: 0, tags: ["VIP"] },
  { name: "Maria Oliveira", phone: "(21) 98888-5678", email: "maria@email.com", visits: 5, noShows: 1, tags: [] },
  { name: "Carlos Santos", phone: "(11) 97777-9012", email: "carlos@email.com", visits: 8, noShows: 0, tags: ["Aniversário"] },
  { name: "Ana Costa", phone: "(31) 96666-3456", email: "ana@email.com", visits: 2, noShows: 2, tags: ["No-Show Recorrente"] },
  { name: "Pedro Almeida", phone: "(11) 95555-7890", email: "pedro@email.com", visits: 20, noShows: 0, tags: ["VIP", "Sommelier"] },
];

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Clientes
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            CRM integrado — histórico e perfil de cada cliente
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--foreground-muted)" }} />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Cliente", "Contato", "Visitas", "No-Shows", "Tags", "Ações"].map((h) => (
                <th key={h} className="text-left text-xs font-medium px-5 py-3" style={{ color: "var(--foreground-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr
                key={i}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderBottom: i < customers.length - 1 ? "1px solid var(--border)" : undefined }}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                      style={{ background: "var(--primary)" }}
                    >
                      {c.name[0]}
                    </div>
                    <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm" style={{ color: "var(--foreground)" }}>{c.phone}</p>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{c.email}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <Star size={13} style={{ color: "var(--warning)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{c.visits}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {c.noShows > 0 ? (
                    <div className="flex items-center gap-1">
                      <AlertTriangle size={13} style={{ color: "var(--danger)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--danger)" }}>{c.noShows}</span>
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {c.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: tag === "VIP" ? "var(--warning)20" : "var(--surface-2)",
                          color: tag === "VIP" ? "var(--warning)" : "var(--foreground-muted)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <button
                    className="text-xs px-3 py-1 rounded-lg transition-opacity hover:opacity-70"
                    style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)" }}
                  >
                    Ver perfil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
