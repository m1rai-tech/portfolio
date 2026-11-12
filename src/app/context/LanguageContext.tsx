import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { content, type Language, type Content } from "../data/content";

const storageKey = "akirasata-language";
const isLanguage = (value: unknown): value is Language =>
  value === "ua" || value === "en";
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: Content;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return isLanguage(saved) ? saved : "en";
    } catch {
      return "en";
    }
  });
  useEffect(() => {
    const t = content[language];
    document.documentElement.lang = t.htmlLang;
    document.title = t.meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t.meta.description);
    try {
      localStorage.setItem(storageKey, language);
    } catch {}
  }, [language]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey && isLanguage(event.newValue))
        setLanguage(event.newValue);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const value = useMemo(
    () => ({ language, setLanguage, t: content[language] }),
    [language],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is required");
  return context;
}
