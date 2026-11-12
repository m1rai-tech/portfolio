import { useEffect, useRef } from "react";

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    const particles = Array.from({ length: 64 }, () => ({
      x: Math.random(),
      y: Math.random(),
      phase: Math.random() * Math.PI * 2,
    }));
    let width = 1;
    let height = 1;
    let frame = 0;
    let lastTime = 0;
    let elapsed = 0;
    let inView = true;
    let pointerX = 0;
    let pointerY = 0;
    let offsetX = 0;
    let offsetY = 0;
    const draw = () => {
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(
        width * 0.65,
        height * 0.4,
        0,
        width * 0.65,
        height * 0.4,
        Math.max(width, height) * 0.7,
      );
      glow.addColorStop(0, "rgba(30,64,128,0.26)");
      glow.addColorStop(1, "rgba(10,14,26,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      const points = particles
        .slice(0, width < 768 ? 36 : 64)
        .map((p) => ({
          x: p.x * width + Math.sin(elapsed * 0.00012 + p.phase) * 12 + offsetX,
          y: p.y * height + Math.cos(elapsed * 0.0001 + p.phase) * 10 + offsetY,
        }));
      const radius = width < 768 ? 100 : 155;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const squared = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
          if (squared >= radius * radius) continue;
          ctx.strokeStyle = `rgba(59,130,246,${(1 - Math.sqrt(squared) / radius) * 0.3})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(103,232,249,0.7)";
      ctx.beginPath();
      for (const p of points) {
        ctx.moveTo(p.x + 1.4, p.y);
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
      }
      ctx.fill();
    };
    const tick = (time: number) => {
      if (!lastTime || time - lastTime >= 32) {
        const delta = lastTime ? Math.min(time - lastTime, 64) : 0;
        elapsed += delta;
        lastTime = time;
        offsetX += (pointerX - offsetX) * 0.07;
        offsetY += (pointerY - offsetY) * 0.07;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      lastTime = 0;
      if (reduced.matches) {
        offsetX = 0;
        offsetY = 0;
        draw();
      } else if (inView && !document.hidden)
        frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || reduced.matches || !inView) return;
      const rect = canvas.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom) {
        pointerX = 0;
        pointerY = 0;
        return;
      }
      pointerX = ((event.clientX - rect.left) / width - 0.5) * 16;
      pointerY = ((event.clientY - rect.top) / height - 0.5) * 12;
    };
    const leave = () => {
      pointerX = 0;
      pointerY = 0;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      restart();
    });
    observer.observe(canvas);
    resize();
    restart();
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", restart);
    reduced.addEventListener("change", restart);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", restart);
      reduced.removeEventListener("change", restart);
    };
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0a0e1a]" />
    </div>
  );
}
