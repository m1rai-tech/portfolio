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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

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
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleMotion = (e: DeviceOrientationEvent) => {
      const x = (e.gamma ?? 0) / 45;
      const y = (e.beta ?? 0) / 90;
      setTilt({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      });
    };
    window.addEventListener("deviceorientation", handleMotion);
    return () => window.removeEventListener("deviceorientation", handleMotion);
  }, []);

  const glassBoxShadow = [
    "0 0 0 0.5px rgba(34,211,238,0.10)",
    "0 20px 60px rgba(0,0,0,0.45)",
    "0 4px 16px rgba(0,0,0,0.30)",
    "inset 0 1.5px 0 rgba(255,255,255,0.22)",
    "inset 1px 0 0 rgba(255,255,255,0.14)",
    "inset 0 -1px 0 rgba(0,0,0,0.20)",
  ].join(", ");

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-white/5 py-3" : "py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <a
            href="#hero"
            className={`font-display tracking-tight text-slate-100 transition-colors hover:text-cyan-300 rounded-full px-3 py-1 -mx-3 -my-1 ${
              scrolled ? "bg-[#0a0e1a]/80 backdrop-blur-xl" : ""
            }`}
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
              <span
                className={`block h-px w-6 bg-current transition-transform duration-300 ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-px bg-current transition-all duration-300 ${
                  open ? "w-0 opacity-0" : "w-6 opacity-100"
                }`}
              />
              <span
                className={`block h-px w-6 bg-current transition-transform duration-300 ${
                  open ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
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
              className="relative md:hidden mx-4 mt-3 rounded-[28px] p-2 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.04) 100%)",
                backdropFilter: "blur(60px) saturate(2.2) brightness(1.15)",
                WebkitBackdropFilter: "blur(60px) saturate(2.2) brightness(1.15)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: glassBoxShadow,
              }}
            >
              {/* Top shine streak */}
              <div
                className="absolute top-0 left-6 right-6 h-px pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.22) 30%, rgba(255,255,255,0.22) 70%, transparent)",
                }}
              />

              {/* Gyroscope highlight */}
              <div
                className="absolute inset-0 pointer-events-none rounded-[28px]"
                style={{
                  background: `radial-gradient(ellipse 60% 40% at ${50 + tilt.x * 30}% ${20 + tilt.y * 20}%, rgba(255,255,255,0.18), transparent 70%)`,
                  transition: "background 0.1s ease-out",
                }}
              />

              {/* Top-left elliptical highlight */}
              <div
                className="absolute -top-4 -left-4 w-40 h-24 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.13), transparent 70%)",
                  filter: "blur(2px)",
                }}
              />

              {/* Cyan internal glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 70%)",
                  filter: "blur(12px)",
                }}
              />

              {/* Bottom inner shadow */}
              <div
                className="absolute bottom-0 inset-x-0 h-10 pointer-events-none rounded-b-[28px]"
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.15), transparent)",
                }}
              />

              {links.map((l, i) => (
                <motion.a
                  key={l.id}
                  href={`#${l.id}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  onClick={() => setOpen(false)}
                  className="group relative flex items-center gap-3 rounded-[18px] px-4 py-3 text-slate-200 transition-all duration-200"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 20px rgba(34,211,238,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                  }}
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
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent)",
                      }}
                    />
                  )}
                </motion.a>
              ))}

              <div
                className="absolute bottom-0 left-1/4 right-1/4 h-px pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
                }}
              />
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
            style={{
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              background: "rgba(0,0,0,0.08)",
            }}
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
              href={`#${l.id}`}
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
              <span
                className={`relative flex h-2 w-2 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-cyan-400"
                    : "bg-slate-600 group-hover:bg-slate-400"
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