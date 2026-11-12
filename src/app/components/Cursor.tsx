import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const labelRef = useRef<string | null>(null);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.4 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    if (!fine.matches) return;
    setEnabled(true);
    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const target = event.target as Element | null;
      const host = target?.closest?.("[data-cursor]");
      const next = host ? host.getAttribute("data-cursor") : null;
      if (next !== labelRef.current) {
        labelRef.current = next;
        setLabel(next);
      }
    };
    const leave = () => {
      labelRef.current = null;
      setLabel(null);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  if (!enabled) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[500]"
    >
      <AnimatePresence>
        {label && (
          <motion.div
            key="cursor"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 30 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="-ml-14 -mt-14 flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-full bg-ember text-ink"
          >
            <ArrowUpRight size={22} />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em]">
              {label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
