import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

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

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled
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

          <button
            className="md:hidden text-slate-300 p-2 -mr-2"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Закрити меню" : "Відкрити меню"}
          >
            <div className="space-y-1.5 w-6">
              <span className={`block h-px w-6 bg-current transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
              <span className={`block h-px bg-current transition-all duration-300 ${open ? "w-0 opacity-0" : "w-6 opacity-100"}`} />
              <span className={`block h-px w-6 bg-current transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{
                opacity: 0,
                scale: 0.92,
                y: -20,
              }}

              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}

              exit={{
                opacity: 0,
                scale: 0.96,
                y: -10,
              }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="
relative
md:hidden
mx-6
mt-3
overflow-hidden
rounded-[28px]
border border-white/15
bg-slate-950/30
p-2
backdrop-blur-3xl
shadow-[0_8px_40px_rgba(0,0,0,0.35)]
"

            >
              <div
  className="absolute inset-0 pointer-events-none"
  style={{
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.05), transparent)",
  }}
/>
              <div
                className="absolute inset-0 rounded-[28px] pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.12), transparent 30%, transparent 70%, rgba(255,255,255,0.08))",
                }}
              />

              <div
                className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none"
              />
              <div
                className="absolute -top-10 left-0 h-24 w-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.18), transparent)",
                }}
              />
              {links.map((l, i) => (
                <motion.a
                  key={l.id}
                  href={`#${l.id}`}
                  whileHover={{
                    scale: 1.02,
                  }}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="
group
relative
flex
items-center
gap-3
rounded-2xl
px-4
py-3
text-slate-200
transition-all
duration-300
hover:bg-white/[0.08]
hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]
hover:backdrop-blur-xl
hover:translate-x-1
"
                >
                  <div
                    className="
  h-5
  w-[2px]
  rounded-full
  bg-cyan-400
  opacity-0
  transition-opacity
  duration-300
  group-hover:opacity-100
  "
                  />
                  <span className="font-mono text-[10px] text-cyan-300/80 w-5">{String(i + 1).padStart(2, "0")}</span>
                  {l.label}
                </motion.a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="
fixed
inset-0
z-40
bg-black/30
backdrop-blur-xl
md:hidden
"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

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
                className={`relative flex h-2 w-2 items-center justify-center rounded-full transition-all duration-300 ${isActive ? "bg-cyan-400" : "bg-slate-600 group-hover:bg-slate-400"
                  }`}
              />
              <span className="hidden lg:block overflow-hidden">
                <motion.span
                  animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -6 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="relative font-mono text-xs text-cyan-300 pointer-events-none select-none"
                >
                  {l.label}
                </motion.span>
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
