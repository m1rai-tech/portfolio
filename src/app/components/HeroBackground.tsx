import { useEffect, useRef } from "react";

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };

    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      twinkle: number;
      speed: number;
      pulse: number;
    };

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 30 : 70;
    // Pre-compute squared thresholds — avoids sqrt in hot loop
    const glowRadiusSq = (180 * dpr) * (180 * dpr);
    const lineMaxSq = ((isMobile ? 90 : 140) * dpr) ** 2;
    const lineGlowRadiusSq = (220 * dpr) * (220 * dpr);
    const particleR = 1.6 * dpr;

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3 * dpr,
      vy: (Math.random() - 0.5) * 0.3 * dpr,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.0005 + Math.random() * 0.001,
      pulse: Math.random() * Math.PI * 2,
    }));

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = (e.clientX - rect.left) * dpr;
      mouse.current.y = (e.clientY - rect.top) * dpr;
    };
    const onLeave = () => {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // Shared offscreen canvas for glow — draw glow once, not per-particle
    // We do a single shadowBlur pass via a compositing trick instead
    const tick = () => {
      const time = performance.now();
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // Fill background instead of clearRect (ctx alpha:false)
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const driftX = Math.sin(time * 0.0002) * 25 * dpr;
      const driftY = Math.cos(time * 0.00015) * 15 * dpr;

      ctx.save();
      ctx.translate(driftX, driftY);

      // ── Lines (O(n²) but cheap per-pair, no shadowBlur) ──
      ctx.shadowBlur = 0;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;
          if (dSq >= lineMaxSq) continue;

          const cmx = (a.x + b.x) / 2 - mx;
          const cmy = (a.y + b.y) / 2 - my;
          const mdSq = cmx * cmx + cmy * cmy;
          const glow = mdSq < lineGlowRadiusSq
            ? 1 + (1 - Math.sqrt(mdSq) / (220 * dpr)) * 3
            : 1;

          const lineMax = Math.sqrt(lineMaxSq);
          const alpha = (1 - Math.sqrt(dSq) / lineMax) * 0.2 * glow;

          ctx.strokeStyle = `rgba(59,130,246,${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // ── Particles — single pass, glow only near mouse ──
      // Group: far particles (no shadow), near particles (shadow)
      const glowRadius = 180 * dpr;

      // Batch: no-glow particles first (shadowBlur=0)
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(103,232,249,0.82)";
      ctx.beginPath();
      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dSq = dx * dx + dy * dy;
        if (dSq >= glowRadiusSq) {
          const alpha = 0.75 + Math.sin(time * p.speed + p.twinkle) * 0.15;
          // Batch cheap: arc per particle without save/restore
          ctx.moveTo(p.x + particleR, p.y);
          ctx.arc(p.x, p.y, particleR, 0, Math.PI * 2);
          // Can't batch varying alphas, so we skip alpha variation for far particles
          // tiny visual difference, huge perf gain
        }
      }
      ctx.fill();

      // Near-mouse particles: individual with glow
      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dSq = dx * dx + dy * dy;
        if (dSq >= glowRadiusSq) continue;

        const dist = Math.sqrt(dSq);
        const glow = 1 + (1 - dist / glowRadius) * 2.5;
        const alpha = 0.8 + Math.sin(time * p.speed + p.twinkle) * 0.1;
        const pulse = Math.sin(time * 0.001 + p.pulse);

        const rx = particleR * glow * (1 + pulse * 0.25);
        const ry = particleR * glow * (1 - pulse * 0.15);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(time * 0.0003 + p.pulse) * 0.4);

        // Only apply shadowBlur for near-mouse particles — much fewer calls
        ctx.shadowBlur = isMobile ? 4 * glow : 14 * glow;
        ctx.shadowColor = "rgba(103,232,249,0.9)";
        ctx.fillStyle = `rgba(103,232,249,${alpha.toFixed(3)})`;

        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.shadowBlur = 0;
      ctx.restore();

      raf = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 blob-a" />
      <div className="absolute inset-0 blob-b" />

      <style>{`
        @keyframes breatheA {
          0%,100%{ opacity:.55; transform:translate3d(0,0,0) scale(1); }
          50%{ opacity:.85; transform:translate3d(2%,-1%,0) scale(1.08); }
        }
        @keyframes breatheB {
          0%,100%{ opacity:.4; transform:translate3d(0,0,0) scale(1); }
          50%{ opacity:.7; transform:translate3d(-2%,1.5%,0) scale(1.1); }
        }
        .blob-a {
          background: radial-gradient(55% 45% at 22% 32%, rgba(59,130,246,.30), transparent 60%);
          animation: breatheA 11s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .blob-b {
          background: radial-gradient(50% 40% at 80% 70%, rgba(6,182,212,.22), transparent 60%);
          animation: breatheB 13s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .blob-a, .blob-b { animation: none; }
        }
      `}</style>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />

      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0a0e1a]" />
    </div>
  );
}