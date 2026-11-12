import { useEffect, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const stops = [0, 0.14, 0.34, 0.6, 0.85, 1];

export function SpaceScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 22,
    mass: 0.5,
  });
  const scale = useTransform(
    progress,
    stops,
    reduce ? [1, 1, 1, 1, 1, 1] : [1, 1.7, 2.5, 1.05, 0.75, 1.15],
  );
  const y = useTransform(
    progress,
    stops,
    reduce
      ? ["62vh", "62vh", "62vh", "62vh", "62vh", "62vh"]
      : ["62vh", "34vh", "8vh", "6vh", "4vh", "26vh"],
  );
  const x = useTransform(
    progress,
    stops,
    reduce
      ? ["0vw", "0vw", "0vw", "0vw", "0vw", "0vw"]
      : ["0vw", "0vw", "0vw", "30vw", "-28vw", "0vw"],
  );
  const opacity = useTransform(
    progress,
    stops,
    [1, 0.8, 0.35, 0.45, 0.45, 0.9],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const count = window.innerWidth < 768 ? 140 : 280;
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 0.96 + 0.04,
    }));
    let width = 1;
    let height = 1;
    let frame = 0;
    let lastY = window.scrollY;
    let velocity = 0;
    let speed = 0.0007;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#d6ebff";
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const k = Math.max(width, height) * 0.6;
      for (const s of stars) {
        const px = cx + (s.x / s.z) * k;
        const py = cy + (s.y / s.z) * k;
        if (px < -10 || px > width + 10 || py < -10 || py > height + 10)
          continue;
        const tail = Math.min(s.z + speed * 7, 1);
        const tx = cx + (s.x / tail) * k;
        const ty = cy + (s.y / tail) * k;
        const depth = 1 - s.z;
        ctx.globalAlpha = Math.min(1, 0.12 + depth * 0.95);
        ctx.lineWidth = 0.5 + depth * 1.8;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px + 0.01, py);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      const current = window.scrollY;
      velocity += (current - lastY - velocity) * 0.12;
      lastY = current;
      speed = Math.min(0.0007 + Math.abs(velocity) * 0.00022, 0.03);
      for (const s of stars) {
        s.z -= speed;
        if (s.z <= 0.04) {
          s.z = 1;
          s.x = Math.random() * 2 - 1;
          s.y = Math.random() * 2 - 1;
        }
      }
      draw();
      frame = requestAnimationFrame(tick);
    };

    const restart = () => {
      cancelAnimationFrame(frame);
      if (!reduced && !document.hidden) frame = requestAnimationFrame(tick);
    };

    resize();
    restart();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", restart);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", restart);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          style={{ x, y, scale, opacity }}
          className="relative aspect-square w-[min(110vw,880px)] shrink-0 will-change-transform"
        >
          <div className="absolute -inset-[14%] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2)_0%,rgba(37,99,235,0.08)_42%,transparent_68%)]" />
          <div className="absolute inset-0 overflow-hidden rounded-full shadow-[0_0_90px_rgba(56,189,248,0.25)]">
            <div className="planet-surface" />
            <div className="absolute inset-0 rounded-full shadow-[inset_-70px_-90px_180px_rgba(3,6,16,0.97),inset_28px_34px_90px_rgba(125,211,252,0.3)]" />
          </div>
          <div className="absolute inset-0 rounded-full border border-cyan-200/15" />
        </motion.div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(6,9,20,0.75)_100%)]" />
    </div>
  );
}
