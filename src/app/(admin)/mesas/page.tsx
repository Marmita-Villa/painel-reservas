"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Save, Users, X, Calendar, Lock, Edit2, ChevronRight } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";

type TableStatus = "FREE" | "RESERVED" | "OCCUPIED" | "BLOCKED";
type TableShape = "rectangle" | "circle" | "square";

interface TableReservation {
  id: string;
  date: string;
  partySize: number;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
}

interface FloorTable {
  id: string;
  roomId: string;
  roomName: string;
  name: string;
  capacity: number;
  posX: number;
  posY: number;
  shape: TableShape;
  isActive: boolean;
  currentStatus: TableStatus;
  currentReservation: TableReservation | null;
}

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; borderColor: string; bg: string; textColor: string; dotColor: string }
> = {
  FREE: {
    label: "Livre",
    borderColor: "#22c55e",
    bg: "#22c55e18",
    textColor: "#22c55e",
    dotColor: "#22c55e",
  },
  RESERVED: {
    label: "Reservada",
    borderColor: "#f59e0b",
    bg: "#f59e0b18",
    textColor: "#f59e0b",
    dotColor: "#f59e0b",
  },
  OCCUPIED: {
    label: "Ocupada",
    borderColor: "#ef4444",
    bg: "#ef444430",
    textColor: "#ef4444",
    dotColor: "#ef4444",
  },
  BLOCKED: {
    label: "Bloqueada",
    borderColor: "#6b7280",
    bg: "#6b728018",
    textColor: "#6b7280",
    dotColor: "#6b7280",
  },
};

const SNAP = 25;
const TABLE_W = 100;
const TABLE_H = 80;

function snapGrid(v: number) {
  return Math.round(v / SNAP) * SNAP;
}

function shapeStyle(shape: TableShape): React.CSSProperties {
  if (shape === "circle") return { borderRadius: "50%" };
  if (shape === "square") return { borderRadius: "4px" };
  return { borderRadius: "8px" };
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MesasPage() {
  const { effectiveRestaurantId } = useRestaurant();
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [movedTables, setMovedTables] = useState<Map<string, { posX: number; posY: number }>>(
    new Map()
  );
  const [saving, setSaving] = useState(false);
  const [showNewTableForm, setShowNewTableForm] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");
  const [newTableShape, setNewTableShape] = useState<TableShape>("rectangle");
  const [creatingTable, setCreatingTable] = useState(false);

  // Drag state (stored in ref so no re-render mid-drag)
  const dragging = useRef<{
    tableId: string;
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const fetchTables = useCallback(async () => {
    if (!effectiveRestaurantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tables?restaurantId=${effectiveRestaurantId}`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [effectiveRestaurantId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // --- Drag & Drop via mouse events ---
  function handleMouseDown(e: React.MouseEvent, table: FloorTable) {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = {
      tableId: table.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: table.posX,
      startPosY: table.posY,
    };
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      const { tableId, startMouseX, startMouseY, startPosX, startPosY } = dragging.current;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      const newX = snapGrid(Math.max(0, startPosX + dx));
      const newY = snapGrid(Math.max(0, startPosY + dy));

      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, posX: newX, posY: newY } : t))
      );
    }

    function onMouseUp() {
      if (!dragging.current) return;
      const { tableId } = dragging.current;
      setTables((prev) => {
        const moved = prev.find((t) => t.id === tableId);
        if (moved) {
          setMovedTables((m) => new Map(m).set(tableId, { posX: moved.posX, posY: moved.posY }));
        }
        return prev;
      });
      dragging.current = null;
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  async function savePositions() {
    if (movedTables.size === 0) return;
    setSaving(true);
    try {
      const body = {
        tables: Array.from(movedTables.entries()).map(([id, pos]) => ({ id, ...pos })),
      };
      await fetch("/api/tables/batch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setMovedTables(new Map());
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function handleCreateTable() {
    if (!effectiveRestaurantId || !newTableName.trim() || !newTableCapacity) return;

    // Find or use first available room
    const firstRoom = tables[0]?.roomId;
    if (!firstRoom) {
      alert("Nenhuma sala disponível. Crie uma sala antes de adicionar mesas.");
      return;
    }

    setCreatingTable(true);
    try {
      // Find a free position
      const occupiedPositions = new Set(tables.map((t) => `${t.posX},${t.posY}`));
      let posX = 50,
        posY = 50;
      outer: for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const cx = snapGrid(50 + col * (TABLE_W + 25));
          const cy = snapGrid(50 + row * (TABLE_H + 25));
          if (!occupiedPositions.has(`${cx},${cy}`)) {
            posX = cx;
            posY = cy;
            break outer;
          }
        }
      }

      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: firstRoom,
          name: newTableName.trim(),
          capacity: Number(newTableCapacity),
          shape: newTableShape,
          posX,
          posY,
        }),
      });
      if (res.ok) {
        setNewTableName("");
        setNewTableCapacity("4");
        setNewTableShape("rectangle");
        setShowNewTableForm(false);
        await fetchTables();
      }
    } catch (err) {
      console.error(err);
    }
    setCreatingTable(false);
  }

  async function handleBlockTable(id: string) {
    try {
      await fetch(`/api/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      await fetchTables();
      setSelectedId(null);
    } catch (err) {
      console.error(err);
    }
  }

  const selectedTable = tables.find((t) => t.id === selectedId) ?? null;

  const summary = {
    FREE: tables.filter((t) => t.currentStatus === "FREE").length,
    RESERVED: tables.filter((t) => t.currentStatus === "RESERVED").length,
    OCCUPIED: tables.filter((t) => t.currentStatus === "OCCUPIED").length,
    BLOCKED: tables.filter((t) => t.currentStatus === "BLOCKED" || !t.isActive).length,
  };

  // Canvas bounds: find rightmost/bottommost table to set min size
  const canvasW = Math.max(
    800,
    ...tables.map((t) => t.posX + TABLE_W + 50)
  );
  const canvasH = Math.max(
    600,
    ...tables.map((t) => t.posY + TABLE_H + 50)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Mesas
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            Mapa visual do salão — arraste as mesas para reorganizar
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {movedTables.size > 0 && (
            <button
              onClick={savePositions}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "#f59e0b" }}
            >
              <Save size={15} />
              {saving ? "Salvando..." : `Salvar posições (${movedTables.size})`}
            </button>
          )}
          <button
            onClick={() => setShowNewTableForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            <Plus size={15} />
            Nova Mesa
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap">
        {(Object.entries(STATUS_CONFIG) as [TableStatus, (typeof STATUS_CONFIG)[TableStatus]][]).map(
          ([key, cfg]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm border-2"
                style={{ background: cfg.bg, borderColor: cfg.borderColor }}
              />
              <span style={{ color: "var(--foreground-muted)" }}>
                {cfg.label}{" "}
                <span style={{ color: "var(--foreground)" }}>({summary[key]})</span>
              </span>
            </div>
          )
        )}
      </div>

      {/* New table form */}
      {showNewTableForm && (
        <div
          className="rounded-xl border p-4 flex flex-wrap items-end gap-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
              Nome
            </label>
            <input
              type="text"
              placeholder="M10"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none w-24"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
              Capacidade
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none w-20"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--foreground-muted)" }}>
              Formato
            </label>
            <select
              value={newTableShape}
              onChange={(e) => setNewTableShape(e.target.value as TableShape)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              <option value="rectangle">Retângulo</option>
              <option value="square">Quadrado</option>
              <option value="circle">Círculo</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateTable}
              disabled={creatingTable || !newTableName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {creatingTable ? "Criando..." : "Criar"}
            </button>
            <button
              onClick={() => setShowNewTableForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
              style={{
                background: "var(--surface-2)",
                color: "var(--foreground-muted)",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Main area: floor map + side panel */}
      <div className="flex gap-4" style={{ minHeight: "600px" }}>
        {/* Floor map canvas */}
        <div
          className="flex-1 rounded-xl border overflow-auto"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {loading ? (
            <div
              className="flex items-center justify-center h-full min-h-96"
              style={{ color: "var(--foreground-muted)" }}
            >
              <div className="text-sm">Carregando mesas...</div>
            </div>
          ) : tables.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full min-h-96 gap-3"
              style={{ color: "var(--foreground-muted)" }}
            >
              <p className="text-sm">Nenhuma mesa cadastrada.</p>
              <button
                onClick={() => setShowNewTableForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--primary)" }}
              >
                <Plus size={14} />
                Criar primeira mesa
              </button>
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                width: `${canvasW}px`,
                height: `${canvasH}px`,
                backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
                backgroundSize: "25px 25px",
                userSelect: "none",
              }}
              onClick={() => setSelectedId(null)}
            >
              {tables.map((table) => {
                const cfg = STATUS_CONFIG[table.currentStatus];
                const isSelected = selectedId === table.id;
                const isCircle = table.shape === "circle";
                const w = isCircle ? TABLE_H : TABLE_W;
                const h = TABLE_H;

                return (
                  <div
                    key={table.id}
                    onMouseDown={(e) => handleMouseDown(e, table)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(isSelected ? null : table.id);
                    }}
                    style={{
                      position: "absolute",
                      left: table.posX,
                      top: table.posY,
                      width: w,
                      height: h,
                      background: cfg.bg,
                      border: `2px solid ${isSelected ? cfg.dotColor : cfg.borderColor}`,
                      boxShadow: isSelected
                        ? `0 0 0 3px ${cfg.borderColor}60, 0 4px 16px rgba(0,0,0,0.15)`
                        : "0 2px 8px rgba(0,0,0,0.08)",
                      cursor: "grab",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      transition: dragging.current?.tableId === table.id
                        ? "none"
                        : "box-shadow 0.15s ease",
                      ...shapeStyle(table.shape),
                    }}
                  >
                    {/* Status dot */}
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: cfg.dotColor,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--foreground)",
                        lineHeight: 1,
                      }}
                    >
                      {table.name}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        color: "var(--foreground-muted)",
                      }}
                    >
                      <Users size={10} />
                      <span style={{ fontSize: 10 }}>{table.capacity}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        color: cfg.textColor,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        {selectedTable && (
          <div
            className="rounded-xl border flex-shrink-0 overflow-y-auto"
            style={{
              width: 280,
              background: "var(--surface)",
              borderColor: "var(--border)",
              padding: "20px",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
                {selectedTable.name}
              </h3>
              <button
                onClick={() => setSelectedId(null)}
                className="p-1 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "var(--foreground-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Table info */}
            <div className="space-y-3 mb-5">
              <div
                className="rounded-lg p-3 space-y-2"
                style={{ background: "var(--surface-2)" }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--foreground-muted)" }}>Capacidade</span>
                  <span style={{ color: "var(--foreground)" }}>
                    até {selectedTable.capacity} pessoas
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--foreground-muted)" }}>Formato</span>
                  <span style={{ color: "var(--foreground)", textTransform: "capitalize" }}>
                    {selectedTable.shape === "circle"
                      ? "Círculo"
                      : selectedTable.shape === "square"
                      ? "Quadrado"
                      : "Retângulo"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--foreground-muted)" }}>Sala</span>
                  <span style={{ color: "var(--foreground)" }}>{selectedTable.roomName}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span style={{ color: "var(--foreground-muted)" }}>Status</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: STATUS_CONFIG[selectedTable.currentStatus].bg,
                      color: STATUS_CONFIG[selectedTable.currentStatus].textColor,
                      border: `1px solid ${STATUS_CONFIG[selectedTable.currentStatus].borderColor}60`,
                    }}
                  >
                    {STATUS_CONFIG[selectedTable.currentStatus].label}
                  </span>
                </div>
              </div>

              {/* Current reservation */}
              {selectedTable.currentReservation ? (
                <div
                  className="rounded-lg p-3 space-y-2"
                  style={{
                    background: STATUS_CONFIG[selectedTable.currentStatus].bg,
                    border: `1px solid ${STATUS_CONFIG[selectedTable.currentStatus].borderColor}40`,
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: STATUS_CONFIG[selectedTable.currentStatus].textColor }}
                  >
                    Reserva ativa
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {selectedTable.currentReservation.customerName && (
                      <div
                        className="font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {selectedTable.currentReservation.customerName}
                      </div>
                    )}
                    <div style={{ color: "var(--foreground-muted)" }}>
                      {formatDateTime(selectedTable.currentReservation.date)}
                    </div>
                    <div style={{ color: "var(--foreground-muted)" }}>
                      {selectedTable.currentReservation.partySize} pessoa(s)
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center py-3" style={{ color: "var(--foreground-muted)" }}>
                  Sem reserva nas próximas 2h
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--primary)20", color: "var(--primary)" }}
              >
                <span className="flex items-center gap-2">
                  <Calendar size={14} />
                  Nova Reserva
                </span>
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => handleBlockTable(selectedTable.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--danger)15", color: "var(--danger)" }}
              >
                <span className="flex items-center gap-2">
                  <Lock size={14} />
                  Bloquear Mesa
                </span>
                <ChevronRight size={14} />
              </button>
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--foreground-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                <span className="flex items-center gap-2">
                  <Edit2 size={14} />
                  Editar Mesa
                </span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
