"use client";

import { type Lang } from "@/lib/translations";

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  style?: React.CSSProperties;
}

export default function LangToggle({ lang, setLang, style }: Props) {
  return (
    <div className="flex items-center rounded-full overflow-hidden border text-xs font-semibold"
      style={{ borderColor: "#e4e4e7", ...style }}>
      {(["pt", "en"] as Lang[]).map((l) => (
        <button key={l} onClick={() => setLang(l)}
          className="px-3 py-1.5 transition-all uppercase tracking-wide"
          style={{
            background: lang === l ? "#f07316" : "#fafafa",
            color: lang === l ? "#fff" : "#71717a",
          }}>
          {l === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
        </button>
      ))}
    </div>
  );
}
