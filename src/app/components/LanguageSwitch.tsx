import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import type { Language } from "../data/content";
import { useGlass } from "./Glass";

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const id = useId();
  const track = useGlass<HTMLDivElement>(false);
  return (
    <div
      ref={track}
      role="group"
      aria-label={t.language.label}
      className="glass glass-flat relative flex shrink-0 items-center rounded-full p-0.5 font-mono text-[0.7rem] tracking-wider"
    >
      {(["ua", "en"] as Language[]).map((locale) => {
        const selected = language === locale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => setLanguage(locale)}
            aria-pressed={selected}
            aria-label={t.language[locale]}
            className={`relative min-h-10 min-w-11 rounded-full px-3 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
              selected ? "text-ink" : "text-paper/60 hover:text-paper"
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`${id}-pill`}
                aria-hidden="true"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 500, damping: 38 }
                }
                className="glass-thumb absolute inset-0 rounded-full bg-paper"
              />
            )}
            <span className="relative">{locale.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
