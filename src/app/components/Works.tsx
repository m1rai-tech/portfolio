import { useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { works, type Work } from "../data/works";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { TiltCard } from "./TiltCard";

const filters = ["All", "Web", "Apps", "Tools"] as const;
type Filter = (typeof filters)[number];

export function Works() {
  const [filter, setFilter] = useState<Filter>("All");
  const [active, setActive] = useState<Work | null>(null);

  const filtered = useMemo(
    () => (filter === "All" ? works : works.filter((w) => w.category === filter)),
    [filter]
  );

  return (
    <section id="works" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="03" label="Works" title="Роботи." />

      <Reveal>
        <div className="mb-10 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-5 py-2 font-mono text-sm transition-all duration-200 ${
                filter === f
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/25 hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </Reveal>

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((w, i) => (
            <motion.div
              layout
              key={w.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <TiltCard
                onClick={() => setActive(w)}
                max={5}
                className="group relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left hover:border-white/20 hover:bg-white/[0.035]"
              >
                <div
                  className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(280px circle at var(--mx,50%) var(--my,50%), rgba(34,211,238,0.15), transparent 60%)",
                  }}
                />
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src={w.coverImage}
                    alt={w.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/30 to-transparent" />
                  <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-slate-200 opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 group-hover:border-cyan-400/60 group-hover:text-cyan-200">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-mono text-xs uppercase tracking-widest text-cyan-400/70">
                    {w.year} · {w.category}
                  </p>
                  <h3
                    className="mt-2 text-slate-100 transition-colors group-hover:text-slate-50"
                    style={{ fontSize: "1.1rem", fontWeight: 400 }}
                  >
                    {w.title}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-slate-600 line-clamp-1">{w.blurb}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <Reveal delay={0.2}>
        <div className="mt-10 flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.015] px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
            <span className="font-mono text-sm font-semibold text-cyan-400">10+</span>
          </div>
          <div>
            <p className="text-sm text-slate-200">Дрібні проекти, експерименти та демо</p>
            <p className="mt-0.5 font-mono text-xs text-slate-600">
              лендінги, утиліти, UI-компоненти — не всі варті окремої картки
            </p>
          </div>
          <a
            href="https://github.com/m1rai-tech"
            target="_blank"
            rel="noreferrer"
            className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-xs text-slate-400 transition-colors hover:border-white/25 hover:text-slate-200"
          >
            GitHub <ArrowUpRight size={13} />
          </a>
        </div>
      </Reveal>

      <AnimatePresence>
        {active && <WorkModal work={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </section>
  );
}

function WorkModal({ work, onClose }: { work: Work; onClose: () => void }) {
  const allImages = [work.coverImage, ...work.images.filter((img) => img !== work.coverImage)];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + allImages.length) % allImages.length));
  }, [allImages.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % allImages.length));
  }, [allImages.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, prev, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxIndex === null) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-[#020410]/85 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0a0e1a] shadow-[0_30px_80px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-slate-300 backdrop-blur-sm transition-all hover:border-white/30 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="overflow-y-auto flex-1 rounded-2xl">
            <button
              className="relative block w-full aspect-[16/9] overflow-hidden group/hero cursor-zoom-in"
              onClick={() => openLightbox(0)}
            >
              <ImageWithFallback
                src={allImages[0]}
                alt={work.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover/hero:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300">
                <div className="rounded-full border border-white/20 bg-black/50 px-4 py-2 font-mono text-xs text-slate-300 backdrop-blur">
                  Відкрити фото
                </div>
              </div>
            </button>

            <div className="p-8 md:p-10">
              <p className="font-mono text-xs uppercase tracking-widest text-cyan-400/80">
                {work.year} · {work.category}
              </p>
              <h3
                className="mt-2 text-slate-100"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 500 }}
              >
                {work.title}
              </h3>
              <p className="mt-5 text-slate-300 leading-relaxed">{work.description}</p>

              {allImages.length > 1 && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {allImages.slice(1).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(i + 1)}
                      className="group/thumb relative overflow-hidden rounded-xl border border-white/10 cursor-zoom-in"
                    >
                      <ImageWithFallback
                        src={img}
                        alt={`${work.title} ${i + 2}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/30 transition-colors duration-300">
                        <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 font-mono text-xs text-slate-300 backdrop-blur">
                          Відкрити
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-8">
                <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Stack</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {work.stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono text-xs text-cyan-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={work.link}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3 font-mono text-sm text-slate-950 transition-opacity hover:opacity-90"
              >
                Відкрити проєкт <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95"
              onClick={closeLightbox}
            >
              <motion.img
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                src={allImages[lightboxIndex]}
                alt={`${work.title} ${lightboxIndex + 1}`}
                className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />

              <button
                onClick={closeLightbox}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-slate-300 backdrop-blur transition-all hover:border-white/30 hover:text-white"
              >
                <X size={18} />
              </button>

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 text-slate-300 backdrop-blur transition-all hover:border-white/30 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 text-slate-300 backdrop-blur transition-all hover:border-white/30 hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-xs text-slate-500">
                {lightboxIndex + 1} / {allImages.length}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}