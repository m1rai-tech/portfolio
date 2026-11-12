import { motion, useReducedMotion } from "framer-motion";
import { content, type Content, type Language } from "../data/content";
import { useLanguage } from "../context/LanguageContext";

export function Copy({
  select,
  className = "",
}: {
  select: (value: Content) => string;
  className?: string;
}) {
  const { language } = useLanguage();
  const reduceMotion = useReducedMotion();
  return (
    <span className={`inline-grid min-w-0 align-top ${className}`}>
      {(["ua", "en"] as Language[]).map((locale) => (
        <motion.span
          key={locale}
          lang={content[locale].htmlLang}
          aria-hidden={locale !== language}
          initial={false}
          animate={{ opacity: locale === language ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          style={{
            gridArea: "1 / 1",
            pointerEvents: locale === language ? "auto" : "none",
            userSelect: locale === language ? "auto" : "none",
          }}
        >
          {select(content[locale])}
        </motion.span>
      ))}
    </span>
  );
}
