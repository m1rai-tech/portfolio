import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const links = [
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "works", label: "Works" },
  { id: "contact", label: "Contact" },
];

const supportsBackdrop =
  typeof CSS !== "undefined" &&
  (CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)"));

const menuStyleGlass: React.CSSProperties = {
  background: "rgba(12, 18, 32, 0.55)",
  backdropFilter: "blur(40px) saturate(1.8) brightness(1.05)",
  WebkitBackdropFilter: "blur(40px) saturate(1.8) brightness(1.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.40), 0 4px 16px rgba(0,0,0,0.25)",
};

const menuStyleSolid: React.CSSProperties = {
  background: "rgba(10, 14, 26, 0.92)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.50)",
};

const overlayStyleGlass: React.CSSProperties = {
  background: "rgba(0,0,0,0.15)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

const overlayStyleSolid: React.CSSProperties = {
  background: "rgba(0,0,0,0.15)",
};

const menuStyle = supportsBackdrop ? menuStyleGlass : menuStyleSolid;
const overlayStyle = supportsBackdrop ? overlayStyleGlass : overlayStyleSolid;

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
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className={scrolled ? "fixed inset-x-0 top-0 z-50 transition-all duration-300 py-3" : "fixed inset-x-0 top-0 z-50 transition-all duration-300 py-5"}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <a
            href="#hero"
            className={scrolled ? "font-display tracking-tight text-slate-100 transition-colors hover:text-cyan-300 rounded-full px-3 py-1 -mx-3 -my-1 bg-[#0a0e1a]/80 backdrop-blur-xl" : "font-display tracking-tight text-slate-100 transition-colors hover:text-cyan-300 rounded-full px-3 py-1 -mx-3 -my-1"}
            style={{ fontSize: scrolled ? "1.05rem" : "1.2rem" }}
          >
            <span className="text-cyan-400">{"●"}</span>{" akirasata"}
          </a>

          <button
            className="md:hidden text-slate-300 p-2 -mr-2"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Закрити меню" : "Відкрити меню"}
          >
            <div className="space-y-1.5 w-6">
              <span className={open ? "block h-px w-6 bg-current transition-transform duration-300 translate-y-[6px] rotate-45" : "block h-px w-6 bg-current transition-transform duration-300"} />
              <span className={open ? "block h-px bg-current transition-all duration-300 w-0 opacity-0" : "block h-px bg-current transition-all duration-300 w-6 opacity-100"} />
              <span className={open ? "block h-px w-6 bg-current transition-transform duration-300 -translate-y-[6px] -rotate-45" : "block h-px w-6 bg-current transition-transform duration-300"} />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative md:hidden mx-4 mt-3 rounded-[28px] p-2"
              style={menuStyle}
            >
              {links.map((l, i) => (
                <motion.a
                  key={l.id}
                  href={"#" + l.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  onClick={() => setOpen(false)}
                  className="group relative flex items-center gap-3 rounded-[18px] px-4 py-3 text-slate-200 transition-all duration-200 hover:bg-white/[0.06]"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div
                    className="h-5 w-[2px] rounded-full bg-cyan-400 transition-opacity duration-200"
                    style={{ opacity: active === l.id ? 1 : 0 }}
                  />
                  <span className="font-mono text-[10px] text-cyan-300/70 w-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-light tracking-wide">
                    {l.label}
                  </span>
                  {i < links.length - 1 && (
                    <div
                      className="absolute bottom-0 left-10 right-4 h-px pointer-events-none"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)" }}
                    />
                  )}
                </motion.a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 md:hidden"
            style={overlayStyle}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <nav className="hidden md:flex fixed left-7 top-1/2 -translate-y-1/2 z-50 flex-col items-start gap-1">
        {links.map((l) => {
          const isActive = active === l.id;
          return (
            <a
              key={l.id}
              href={"#" + l.id}
              className="group relative flex items-center gap-2.5 rounded-full px-3 py-2 outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="side-pill"
                  className="absolute inset-0 rounded-full border border-cyan-400/25"
                  style={{ backgroundColor: "rgba(34,211,238,0.06)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className={isActive ? "relative flex h-2 w-2 items-center justify-center rounded-full transition-all duration-300 bg-cyan-400" : "relative flex h-2 w-2 items-center justify-center rounded-full transition-all duration-300 bg-slate-600 group-hover:bg-slate-400"} />
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