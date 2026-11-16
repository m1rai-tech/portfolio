import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type LazyExoticComponent,
  type ComponentType,
} from "react";
import { motion } from "framer-motion";

const variants = [
  {
    id: "glass",
    label: "Скло",
    load: () => import("./BgGlassShapes").then((m) => ({ default: m.BgGlassShapes })),
  },
  {
    id: "chrome",
    label: "Хром",
    load: () => import("./BgChrome").then((m) => ({ default: m.BgChrome })),
  },
  {
    id: "fluid",
    label: "Рідина",
    load: () => import("./BgFluid").then((m) => ({ default: m.BgFluid })),
  },
  {
    id: "caustics",
    label: "Каустика",
    load: () => import("./BgCaustics").then((m) => ({ default: m.BgCaustics })),
  },
  {
    id: "fluted",
    label: "Рифлене",
    load: () => import("./BgFluted").then((m) => ({ default: m.BgFluted })),
  },
  {
    id: "particles",
    label: "Частинки",
    load: () => import("./BgParticles").then((m) => ({ default: m.BgParticles })),
  },
  {
    id: "terrain",
    label: "Ландшафт",
    load: () => import("./BgTerrain").then((m) => ({ default: m.BgTerrain })),
  },
  {
    id: "dither",
    label: "Пікселі",
    load: () => import("./BgDither").then((m) => ({ default: m.BgDither })),
  },
  {
    id: "smoke",
    label: "Дим",
    load: () => import("./ShaderBackground").then((m) => ({ default: m.ShaderBackground })),
  },
] as const;

type VariantId = (typeof variants)[number]["id"];

const components = Object.fromEntries(
  variants.map((variant) => [variant.id, lazy(variant.load)]),
) as unknown as Record<VariantId, LazyExoticComponent<ComponentType>>;

const storageKey = "portfolio-background";

const isVariant = (value: string | null): value is VariantId =>
  variants.some((variant) => variant.id === value);

function initialVariant(): VariantId {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("bg");
    if (isVariant(fromUrl)) return fromUrl;
    const stored = window.localStorage.getItem(storageKey);
    if (isVariant(stored)) return stored;
  } catch {
    return "glass";
  }
  return "glass";
}

export function BackgroundStage() {
  const [active, setActive] = useState<VariantId>(initialVariant);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, active);
    } catch {
      return;
    }
  }, [active]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      if (event.key.toLowerCase() !== "b" || event.metaKey || event.ctrlKey)
        return;
      setActive((current) => {
        const index = variants.findIndex((variant) => variant.id === current);
        return variants[(index + 1) % variants.length].id;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Active = components[active];

  return (
    <>
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 bg-ink"
          />
        }
      >
        <Active key={active} />
      </Suspense>
      <div
        role="group"
        aria-label="Фон"
        className="glass-switcher fixed bottom-4 left-1/2 z-[70] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 gap-1 overflow-x-auto rounded-full border border-paper/15 bg-ink/85 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_40px_rgba(0,0,0,0.35)] [scrollbar-width:none] md:bottom-6 md:left-6 md:translate-x-0"
      >
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            aria-pressed={active === variant.id}
            onClick={() => setActive(variant.id)}
            className="relative shrink-0 rounded-full px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-paper/65 transition-colors hover:text-paper md:px-4"
          >
            {active === variant.id && (
              <motion.span
                layoutId="background-switcher-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-paper"
              />
            )}
            <span
              className={`relative ${active === variant.id ? "text-ink" : ""}`}
            >
              {variant.label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
