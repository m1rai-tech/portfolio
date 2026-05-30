import { useEffect, useState } from "react";
import { motion } from "motion/react";

const links = [
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "works", label: "Works" },
  { id: "contact", label: "Contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const trackActive = () => {
      const mid = window.scrollY + window.innerHeight / 2;
      let current = "";
      for (const { id } of links) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= mid) current = id;
      }
      setActive(current);
    };
    trackActive();
    window.addEventListener("scroll", trackActive, { passive: true });
    return () => window.removeEventListener("scroll", trackActive);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/5 bg-[#0a0e1a]/80 py-3 backdrop-blur-xl"
            : "py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <a
            href="#hero"
            className="font-display tracking-tight text-slate-100 transition-colors hover:text-cyan-300"
            style={{ fontSize: scrolled ? "1.05rem" : "1.2rem" }}
          >
            <span className="text-cyan-400">●</span> akirasata
          </a>

          <a
            href="#contact"
            className="hidden md:inline-flex rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1.5 font-mono text-sm text-cyan-200 transition-all hover:border-cyan-300 hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Hire me
          </a>

          <button
            className="md:hidden text-slate-300"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <div className="space-y-1.5">
              <span className={`block h-px w-6 bg-current transition-transform ${open ? "translate-y-[6px] rotate-45" : ""}`} />
              <span className={`block h-px w-6 bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`block h-px w-6 bg-current transition-transform ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
            </div>
          </button>
        </div>

        {open && (
          <nav className="md:hidden mx-6 mt-3 rounded-2xl border border-white/10 bg-[#0a0e1a]/95 p-4 backdrop-blur-xl">
            {links.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={() => setOpen(false)}
                className="block py-2 font-mono text-sm text-slate-300 hover:text-cyan-300"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* Side nav — desktop only */}
      <nav className="hidden md:flex fixed left-7 top-1/2 -translate-y-1/2 z-50 flex-col items-start gap-1">
        {links.map((l) => {
          const isActive = active === l.id;
          return (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="group relative flex items-center gap-2.5 rounded-full px-3 py-2 outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="side-pill"
                  className="absolute inset-0 rounded-full border border-cyan-400/25 bg-cyan-400/8"
                  style={{ backgroundColor: "rgba(34,211,238,0.06)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={`relative flex h-2 w-2 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.85)]"
                    : "bg-slate-600 group-hover:bg-slate-400"
                }`}
              />
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0,
                  x: isActive ? 0 : -6,
                }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative font-mono text-xs text-cyan-300 pointer-events-none select-none"
              >
                {l.label}
              </motion.span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
