"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, UtensilsCrossed, X, Check, Loader2, Tag } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";
import PlanGate from "@/components/admin/PlanGate";
import ImageUpload from "@/components/admin/ImageUpload";

const TAGS = ["Vegetariano 🥦", "Vegano 🌱", "Sem glúten 🌾", "Sem lactose 🥛", "Picante 🌶️", "Novidade ✨", "Mais pedido ⭐"];

interface MenuItem {
  id: string; name: string; description?: string | null;
  price?: number | null; imageUrl?: string | null;
  tags: string[]; isActive: boolean; isSoldOut: boolean; position: number;
}
interface MenuCategory {
  id: string; name: string; description?: string | null;
  isActive: boolean; position: number; items: MenuItem[];
}

function formatPrice(p: number) {
  return `R$ ${p.toFixed(2).replace(".", ",")}`;
}

function ItemForm({ categoryId, item, onSave, onCancel }: {
  categoryId: string; item?: MenuItem | null;
  onSave: (data: any) => Promise<void>; onCancel: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [desc, setDesc] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const [saving, setSaving] = useState(false);

  function toggleTag(t: string) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: desc || null, price: price ? Number(price) : null, imageUrl: imageUrl || null, tags });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-5 space-y-4"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
            Nome do item *
          </label>
          <input required value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex: Filé ao molho madeira"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
            Descrição
          </label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
            placeholder="Ingredientes, modo de preparo..."
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
            Preço (R$)
          </label>
          <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="col-span-2">
          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            folder="reserva360/menu"
            label="Foto do prato"
            hint="JPG, PNG, WebP — máx. 5MB"
            aspectRatio="wide"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(t => (
            <button key={t} type="button" onClick={() => toggleTag(t)}
              className="px-2.5 py-1 rounded-full text-xs border transition-all"
              style={{
                background: tags.includes(t) ? "var(--primary)15" : "var(--surface)",
                borderColor: tags.includes(t) ? "var(--primary)" : "var(--border)",
                color: tags.includes(t) ? "var(--primary)" : "var(--foreground-muted)",
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm border transition-opacity hover:opacity-70"
          style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}>
          Cancelar
        </button>
        <button type="submit" disabled={saving || !name.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-80"
          style={{ background: "var(--primary)", color: "#fff" }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {item ? "Salvar" : "Adicionar"}
        </button>
      </div>
    </form>
  );
}

function CategoryBlock({ category, onUpdate, onDelete }: {
  category: MenuCategory;
  onUpdate: (cat: MenuCategory) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [catName, setCatName] = useState(category.name);
  const [saving, setSaving] = useState(false);

  async function saveCategoryName() {
    if (!catName.trim() || catName === category.name) { setEditingName(false); return; }
    setSaving(true);
    const res = await fetch(`/api/menu/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName.trim() }),
    });
    const data = await res.json();
    if (res.ok) onUpdate(data);
    setSaving(false);
    setEditingName(false);
  }

  async function toggleCategoryActive() {
    const res = await fetch(`/api/menu/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !category.isActive }),
    });
    const data = await res.json();
    if (res.ok) onUpdate(data);
  }

  async function addItem(data: any) {
    const res = await fetch(`/api/menu/${category.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const item = await res.json();
      onUpdate({ ...category, items: [...category.items, item] });
    }
    setAddingItem(false);
  }

  async function updateItem(itemId: string, data: any) {
    const res = await fetch(`/api/menu/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate({ ...category, items: category.items.map(i => i.id === itemId ? updated : i) });
    }
    setEditingItem(null);
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Remover item?")) return;
    const res = await fetch(`/api/menu/items/${itemId}`, { method: "DELETE" });
    if (res.ok) onUpdate({ ...category, items: category.items.filter(i => i.id !== itemId) });
  }

  async function toggleItemField(item: MenuItem, field: "isActive" | "isSoldOut") {
    const res = await fetch(`/api/menu/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !item[field] }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate({ ...category, items: category.items.map(i => i.id === item.id ? updated : i) });
    }
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Category header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        {editingName ? (
          <input autoFocus value={catName} onChange={e => setCatName(e.target.value)}
            onBlur={saveCategoryName} onKeyDown={e => e.key === "Enter" && saveCategoryName()}
            className="flex-1 px-2 py-1 rounded-lg text-sm font-semibold outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--primary)", color: "var(--foreground)" }} />
        ) : (
          <h3 className="flex-1 font-bold text-base cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: category.isActive ? "var(--foreground)" : "var(--foreground-muted)" }}
            onClick={() => setEditingName(true)}>
            {category.name}
            <Edit3 size={12} className="inline ml-2 opacity-40" />
          </h3>
        )}
        <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{category.items.length} itens</span>
        <button onClick={toggleCategoryActive} className="text-xs px-2.5 py-1 rounded-full border transition-all"
          style={{
            background: category.isActive ? "var(--success)15" : "var(--surface-2)",
            borderColor: category.isActive ? "var(--success)" : "var(--border)",
            color: category.isActive ? "var(--success)" : "var(--foreground-muted)",
          }}>
          {category.isActive ? "Ativo" : "Oculto"}
        </button>
        <button onClick={() => { if (confirm("Excluir categoria e todos os itens?")) onDelete(category.id); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-50"
          style={{ color: "var(--danger)" }}>
          <Trash2 size={14} />
        </button>
        <button onClick={() => setExpanded(e => !e)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ color: "var(--foreground-muted)" }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="p-5 space-y-3">
          {/* Items list */}
          {category.items.map(item => (
            <div key={item.id}>
              {editingItem?.id === item.id ? (
                <ItemForm categoryId={category.id} item={item}
                  onSave={data => updateItem(item.id, data)}
                  onCancel={() => setEditingItem(null)} />
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-xl border transition-all"
                  style={{ background: "var(--surface-2)", borderColor: item.isSoldOut ? "var(--warning)" : "var(--border)", opacity: item.isActive ? 1 : 0.5 }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)", textDecoration: item.isSoldOut ? "line-through" : "none" }}>{item.name}</p>
                      {item.isSoldOut && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "var(--warning)20", color: "var(--warning)" }}>86 · Esgotado</span>}
                      {item.tags.map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--primary)10", color: "var(--primary)" }}>{t}</span>
                      ))}
                    </div>
                    {item.description && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--foreground-muted)" }}>{item.description}</p>
                    )}
                    {item.price != null && (
                      <p className="text-sm font-bold mt-1" style={{ color: "var(--success)" }}>{formatPrice(item.price)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleItemField(item, "isSoldOut")}
                      title={item.isSoldOut ? "Disponível" : "Marcar como esgotado"}
                      className="text-xs px-2 py-1 rounded-full border transition-all font-semibold"
                      style={{
                        background: item.isSoldOut ? "var(--warning)20" : "transparent",
                        borderColor: item.isSoldOut ? "var(--warning)" : "var(--border)",
                        color: item.isSoldOut ? "var(--warning)" : "var(--foreground-muted)",
                      }}>
                      {item.isSoldOut ? "Esgotado" : "86"}
                    </button>
                    <button onClick={() => toggleItemField(item, "isActive")} className="text-xs px-2 py-1 rounded-full border transition-all"
                      style={{
                        background: item.isActive ? "transparent" : "var(--surface-3, var(--surface))",
                        borderColor: "var(--border)",
                        color: "var(--foreground-muted)",
                      }}>
                      {item.isActive ? "Visível" : "Oculto"}
                    </button>
                    <button onClick={() => setEditingItem(item)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                      style={{ color: "var(--foreground-muted)" }}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                      style={{ color: "var(--danger)" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add item */}
          {addingItem ? (
            <ItemForm categoryId={category.id}
              onSave={addItem}
              onCancel={() => setAddingItem(false)} />
          ) : (
            <button onClick={() => setAddingItem(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed text-sm transition-all hover:opacity-70"
              style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}>
              <Plus size={15} /> Adicionar item
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CardapioContent() {
  const { effectiveRestaurantId } = useRestaurant();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    if (!effectiveRestaurantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/menu?restaurantId=${effectiveRestaurantId}`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, [effectiveRestaurantId]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  async function addCategory() {
    if (!newCatName.trim() || !effectiveRestaurantId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), restaurantId: effectiveRestaurantId }),
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories(prev => [...prev, cat]);
        setNewCatName("");
        setAddingCat(false);
      }
    } catch {}
    setSaving(false);
  }

  async function deleteCategory(id: string) {
    const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
    if (res.ok) setCategories(prev => prev.filter(c => c.id !== id));
  }

  function updateCategory(updated: MenuCategory) {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Cardápio Digital</h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            Exibido na página pública do restaurante
          </p>
        </div>
        <button onClick={() => setAddingCat(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "var(--primary)", color: "#fff" }}>
          <Plus size={15} /> Nova categoria
        </button>
      </div>

      {/* Add category form */}
      {addingCat && (
        <div className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <UtensilsCrossed size={16} style={{ color: "var(--foreground-muted)" }} />
          <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCategory()}
            placeholder="Nome da categoria (ex: Entradas, Pratos Principais, Sobremesas...)"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          <button onClick={() => { setAddingCat(false); setNewCatName(""); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg opacity-50 hover:opacity-100"
            style={{ color: "var(--foreground-muted)" }}>
            <X size={14} />
          </button>
          <button onClick={addCategory} disabled={saving || !newCatName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--primary)", color: "#fff" }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Criar
          </button>
        </div>
      )}

      {!effectiveRestaurantId ? (
        <div className="p-10 text-center rounded-2xl border border-dashed" style={{ borderColor: "var(--border)" }}>
          <UtensilsCrossed size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--foreground-muted)" }} />
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>Selecione um restaurante</p>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
            Use o seletor no header para escolher o restaurante antes de editar o cardápio.
          </p>
        </div>
      ) : loading ? (
        <div className="p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando cardápio...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed"
          style={{ borderColor: "var(--border)" }}>
          <UtensilsCrossed size={36} className="mx-auto mb-4 opacity-20" style={{ color: "var(--foreground-muted)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Nenhuma categoria ainda</p>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            Crie categorias como Entradas, Pratos Principais, Bebidas...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(cat => (
            <CategoryBlock key={cat.id} category={cat}
              onUpdate={updateCategory}
              onDelete={deleteCategory} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CardapioPage() {
  return (
    <PlanGate requiredPlan="PRO" feature="Cardápio digital publicado na página do restaurante">
      <CardapioContent />
    </PlanGate>
  );
}
