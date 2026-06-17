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
      angle: number;
      wanderFreq: number;
      wanderPhase: number;
    };

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 42 : 95;
    // Pre-compute squared thresholds — avoids sqrt in hot loop
    const glowRadiusSq = (180 * dpr) * (180 * dpr);
    // Slightly larger connect radius → fewer lonely stars (free: O(n²) loop
    // runs over all pairs regardless of this threshold)
    const lineMaxSq = ((isMobile ? 100 : 155) * dpr) ** 2;
    const lineGlowRadiusSq = (220 * dpr) * (220 * dpr);
    const particleR = 1.6 * dpr;

    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const sp = (0.15 + Math.random() * 0.2) * dpr;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.0005 + Math.random() * 0.001,
        pulse: Math.random() * Math.PI * 2,
        angle,
        wanderFreq: 0.0002 + Math.random() * 0.0006,
        wanderPhase: Math.random() * Math.PI * 2,
      };
    });

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
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, cw, ch);

      // ── Ambient light/dark transitions: two big soft radial patches that
      //    slowly roam the canvas — a lighter blue glow and an opposing dark
      //    pool — giving the background drifting depth. ──
      const maxDim = Math.max(cw, ch);
      const lx = cw * (0.5 + Math.sin(time * 0.00005) * 0.38);
      const ly = ch * (0.5 + Math.cos(time * 0.00007) * 0.38);
      const lightGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, maxDim * 0.7);
      lightGrad.addColorStop(0, "rgba(30,64,128,0.30)");
      lightGrad.addColorStop(1, "rgba(10,14,26,0)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, cw, ch);

      const dx2 = cw * (0.5 - Math.sin(time * 0.00004) * 0.42);
      const dy2 = ch * (0.5 - Math.cos(time * 0.00006) * 0.42);
      const darkGrad = ctx.createRadialGradient(dx2, dy2, 0, dx2, dy2, maxDim * 0.6);
      darkGrad.addColorStop(0, "rgba(2,4,12,0.45)");
      darkGrad.addColorStop(1, "rgba(2,4,12,0)");
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, cw, ch);

      const driftX = Math.sin(time * 0.0002) * 25 * dpr;
      const driftY = Math.cos(time * 0.00015) * 15 * dpr;

      // ── Update positions via a slow "flow field": the heading depends on
      //    a star's position + time, so neighbouring stars drift together
      //    while distant regions flow in different directions — the whole
      //    field gently streams and the constellations reshape. ──
      const accel = 0.0012 * dpr;
      const maxV = 0.045 * dpr;
      const w = canvas.width;
      const h = canvas.height;
      const t = time * 0.000022;
      // Low spatial frequency → smooth regional flow (independent of dpr)
      const fx = 0.0011 / dpr;
      const fy = 0.0011 / dpr;
      for (const p of particles) {
        // Field angle: varies across space and slowly over time
        const field =
          Math.sin(p.x * fx + t) +
          Math.cos(p.y * fy - t * 0.8);
        const a = field * Math.PI + p.wanderPhase * 0.4;

        p.vx += Math.cos(a) * accel;
        p.vy += Math.sin(a) * accel;

        // Damp and clamp speed so the drift stays slow and weightless
        p.vx *= 0.985;
        p.vy *= 0.985;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > maxV) {
          p.vx = (p.vx / sp) * maxV;
          p.vy = (p.vy / sp) * maxV;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Soft bounce off edges so stars stay in view
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        else if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        else if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy); }
      }

      ctx.save();
      ctx.translate(driftX, driftY);

      // ── Lines (O(n²) but cheap per-pair, no shadowBlur) ──
      // Hoist invariants out of the hot loop (constant for the whole frame)
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      const lineMax = Math.sqrt(lineMaxSq);
      const lineGlowR = 220 * dpr;
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
            ? 1 + (1 - Math.sqrt(mdSq) / lineGlowR) * 3
            : 1;

          const alpha = (1 - Math.sqrt(dSq) / lineMax) * 0.2 * glow;

          ctx.strokeStyle = `rgba(59,130,246,${alpha.toFixed(3)})`;
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
