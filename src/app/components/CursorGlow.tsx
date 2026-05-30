import { useEffect, useRef, useState } from "react";

export function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -200, y: -200 });
  const ring = useRef({ x: -200, y: -200 });
  const blob = useRef({ x: -200, y: -200 });
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest(
        "a, button, [role='button'], input, textarea, label, .cursor-hover"
      );
      setHover(interactive);
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const tick = () => {
      ring.current.x += (target.current.x - ring.current.x) * 0.18;
      ring.current.y += (target.current.y - ring.current.y) * 0.18;
      blob.current.x += (target.current.x - blob.current.x) * 0.06;
      blob.current.y += (target.current.y - blob.current.y) * 0.06;

      if (dotRef.current)
        dotRef.current.style.transform = `translate3d(${target.current.x - 3}px, ${target.current.y - 3}px, 0)`;
      if (ringRef.current)
        ringRef.current.style.transform = `translate3d(${ring.current.x - 16}px, ${ring.current.y - 16}px, 0)`;
      if (blobRef.current)
        blobRef.current.style.transform = `translate3d(${blob.current.x - 160}px, ${blob.current.y - 160}px, 0)`;

      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={blobRef}
        className="pointer-events-none fixed left-0 top-0 z-[5] h-[320px] w-[320px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.10) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)",
          willChange: "transform",
        }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full border transition-[width,height,border-color,background-color] duration-300 ease-out"
        style={{
          width: hover ? 48 : 32,
          height: hover ? 48 : 32,
          marginLeft: hover ? -8 : 0,
          marginTop: hover ? -8 : 0,
          borderColor: hover ? "rgba(34,211,238,0.9)" : "rgba(148,163,184,0.5)",
          background: hover ? "rgba(34,211,238,0.08)" : "transparent",
          boxShadow: hover ? "0 0 24px rgba(34,211,238,0.35)" : "none",
          willChange: "transform, width, height",
        }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[101] h-1.5 w-1.5 rounded-full bg-cyan-300"
        style={{ willChange: "transform", boxShadow: "0 0 10px rgba(34,211,238,0.8)" }}
      />
    </>
  );
}
