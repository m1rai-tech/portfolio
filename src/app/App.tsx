import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Stack } from "./components/Stack";
import { Works } from "./components/Works";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { CursorGlow } from "./components/CursorGlow";
import { ScrollProgress } from "./components/ScrollProgress";
import { useEffect } from "react";

const FAVICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='%233b82f6'/><stop offset='1' stop-color='%2306b6d4'/></linearGradient></defs><rect width='32' height='32' rx='8' fill='%230a0e1a'/><circle cx='16' cy='16' r='6' fill='url(%23g)'/></svg>";

export default function App() {
  useEffect(() => {
    const link =
      (document.querySelector("link[rel*='icon']") as HTMLLinkElement | null) ??
      document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }));
    link.href = FAVICON;
    document.title = "akirasata — web dev · 2026";

    if (!(window as unknown as { __egg?: boolean }).__egg) {
      (window as unknown as { __egg?: boolean }).__egg = true;
      const c1 = "color:#22d3ee;font-family:JetBrains Mono,monospace;font-size:13px;";
      const c2 = "color:#94a3b8;font-family:JetBrains Mono,monospace;font-size:12px;";
      // eslint-disable-next-line no-console
      console.log("%cпривіт, девтулзер 👋%c\nякщо ти тут — ти точно мій клієнт.\nпиши: @akirasata (tg)", c1, c2);
    }
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#0a0e1a] text-slate-200 antialiased"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{`
        html { scroll-behavior: smooth; }
        body { background:#0a0e1a; }
        @media (pointer: fine) { body, a, button, input, textarea, label { cursor: none; } }
        .font-display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        ::selection { background: rgba(34,211,238,0.3); color: #e2f5ff; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #0a0e1a; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#1e3a8a,#0e7490); border-radius: 10px; }

        .link-underline { position: relative; }
        .link-underline::after {
          content: ""; position: absolute; left: 0; bottom: -2px; height: 1px; width: 100%;
          background: linear-gradient(90deg, #3b82f6, #22d3ee);
          transform: scaleX(0); transform-origin: 0 50%;
          transition: transform .45s cubic-bezier(.22,1,.36,1);
        }
        .link-underline:hover::after { transform: scaleX(1); }

        .ripple { position: relative; overflow: hidden; }
        .ripple::after {
          content: ""; position: absolute; left: 50%; top: 50%;
          width: 8px; height: 8px; border-radius: 9999px;
          background: rgba(255,255,255,0.45);
          transform: translate(-50%,-50%) scale(1); opacity: 0;
          pointer-events: none;
        }
        .ripple:active::after { animation: ripple-anim .6s ease-out; }
        @keyframes ripple-anim {
          0% { opacity: .6; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(40); }
        }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 80;
          opacity: .06; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          background-size: 160px 160px;
        }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-60"
        style={{
          background:
            "radial-gradient(80% 50% at 50% -10%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(60% 40% at 100% 60%, rgba(6,182,212,0.10), transparent 70%)",
        }}
      />

      <div className="grain" aria-hidden />
      <ScrollProgress />
      <CursorGlow />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <About />
        <Stack />
        <Works />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
