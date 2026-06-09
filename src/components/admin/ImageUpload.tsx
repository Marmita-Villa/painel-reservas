"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  aspectRatio?: "square" | "wide" | "free";
}

export default function ImageUpload({
  value,
  onChange,
  folder = "reserva360",
  label,
  hint,
  aspectRatio = "free",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao fazer upload");
      } else {
        onChange(data.url);
      }
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const previewStyle: React.CSSProperties = {
    aspectRatio: aspectRatio === "square" ? "1/1" : aspectRatio === "wide" ? "16/9" : undefined,
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm mb-1" style={{ color: "var(--foreground-muted)" }}>
          {label}
        </label>
      )}

      {/* Preview or dropzone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="relative rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden flex items-center justify-center"
        style={{
          borderColor: dragging ? "var(--primary)" : value ? "transparent" : "var(--border)",
          background: dragging ? "var(--primary)10" : value ? "transparent" : "var(--surface-2)",
          minHeight: 100,
          ...previewStyle,
        }}>

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Enviando...</p>
          </div>
        ) : value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-lg">
                Clique para trocar
              </span>
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--surface-3)" }}>
              <Upload size={18} style={{ color: "var(--foreground-muted)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Clique ou arraste a imagem
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                {hint ?? "JPG, PNG, WebP — máx. 5MB"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* URL manual fallback */}
      <div className="flex items-center gap-2">
        <ImageIcon size={13} style={{ color: "var(--foreground-muted)", flexShrink: 0 }} />
        <input
          type="url"
          placeholder="Ou cole uma URL de imagem..."
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        />
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg"
          style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
