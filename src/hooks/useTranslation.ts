"use client";

import { useState, useEffect, useCallback } from "react";
import { type Lang, type TranslationKey, t as translate } from "@/lib/translations";

const STORAGE_KEY = "reserva_lang";

function detectLang(): Lang {
  if (typeof window === "undefined") return "pt";
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored === "pt" || stored === "en") return stored;
  // Auto-detect from browser
  const browser = navigator.language.toLowerCase();
  return browser.startsWith("pt") ? "pt" : "en";
}

export function useTranslation() {
  const [lang, setLangState] = useState<Lang>("pt"); // SSR-safe default

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  return { lang, setLang, t };
}
