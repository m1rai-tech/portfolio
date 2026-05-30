import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDown, Mail } from "lucide-react";
import { useRef } from "react";
import { HeroBackground } from "./HeroBackground";
import { Socials } from "./Socials";
import { Magnetic } from "./Magnetic";

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
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-mono text-sm text-cyan-300/80"
        >
          <span className="text-cyan-400">{"//"}</span> portfolio · 2026
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
          className="mt-6 max-w-xl font-mono text-base text-slate-400 md:text-lg"
        >
          Web Developer · React, Next.js, Electron.
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
              className="ripple group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-3.5 font-mono text-sm text-slate-950 shadow-[0_0_30px_rgba(59,130,246,0.35)] transition-shadow duration-300 hover:shadow-[0_0_45px_rgba(34,211,238,0.55)]"
            >
              Дивитися роботи
              <ArrowDown size={16} className="transition-transform group-hover:translate-y-0.5" />
            </a>
          </Magnetic>
          <Magnetic strength={0.3}>
            <a
              href="#contact"
              className="ripple group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-mono text-sm text-slate-200 backdrop-blur transition-colors duration-300 hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-200"
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 font-mono text-xs text-slate-500">
          <span>scroll</span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="block h-8 w-px bg-gradient-to-b from-cyan-400 to-transparent"
          />
        </div>
      </motion.div>
    </section>
  );
}
