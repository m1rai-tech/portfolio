import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDown, Mail } from "lucide-react";
import { useRef } from "react";
import { HeroBackground } from "./HeroBackground";
import { Socials } from "./Socials";
import { Magnetic } from "./Magnetic";

const techStack = ["React", "TypeScript", "Next.js", "Supabase", "Electron", "Vercel"];

function HeroCards() {
  return (
    <div className="hidden lg:flex flex-col gap-4 items-end justify-center pb-8">
      {/* Status */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-60 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          <span className="font-mono text-xs text-slate-500">доступний</span>
        </div>
        <p className="mt-2 text-sm text-slate-200">Відкритий до нових проектів</p>
        <p className="mt-0.5 font-mono text-xs text-slate-600">фріланс · повний цикл</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.0, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-72 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
      >
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-display text-2xl font-semibold text-slate-100">1+</p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-600 uppercase tracking-wide">рік</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-slate-100">5+</p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-600 uppercase tracking-wide">проекти</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-slate-100">AI</p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-600 uppercase tracking-wide">напрямок</p>
          </div>
        </div>
      </motion.div>

      {/* Stack */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-64 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-3">stack</p>
        <div className="flex flex-wrap gap-1.5">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-slate-400"
            >
              {tech}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section id="hero" ref={ref} className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <HeroBackground />
      </div>
      <motion.div
        style={{ y, opacity }}
        className="relative z-20 mx-auto w-full max-w-7xl px-6 pt-32"
      >
        <div className="grid lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left column */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-mono text-sm text-slate-500"
            >
              <span className="text-cyan-400/80">{"//"}</span> frontend · 2026
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-display mt-4 leading-[0.95] tracking-tight"
              style={{ fontSize: "clamp(3rem, 11vw, 9rem)", fontWeight: 600 }}
            >
              <span className="block text-slate-100">akira</span>
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                sata.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-6 max-w-lg text-base text-slate-400 md:text-lg leading-relaxed"
            >
              Будую веб і десктоп через vibe coding та prompt engineering.
              Є задача — розберусь і зроблю.
              <span className="block mt-1 font-mono text-sm text-slate-600">
                React · Next.js · Electron · TypeScript
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-10 flex flex-row flex-wrap items-center gap-4"
            >
              <Magnetic strength={0.3}>
                <a
                  href="#works"
                  className="ripple group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-3.5 font-mono text-sm text-slate-950 transition-opacity duration-300 hover:opacity-90"
                >
                  Дивитися роботи
                  <ArrowDown size={16} className="transition-transform group-hover:translate-y-0.5" />
                </a>
              </Magnetic>
              <Magnetic strength={0.3}>
                <a
                  href="#contact"
                  className="ripple group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-mono text-sm text-slate-200 backdrop-blur transition-colors duration-300 hover:border-white/30 hover:bg-white/10"
                >
                  <Mail size={16} />
                  Написати
                </a>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="mt-12"
            >
              <Socials />
            </motion.div>
          </div>

          {/* Right column — floating cards */}
          <HeroCards />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      >
        
      </motion.div>
    </section>
  );
}
