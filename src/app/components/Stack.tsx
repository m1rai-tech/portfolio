import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

const stack = [
  "TypeScript",
  "React",
  "Next.js",
  "Electron",
  "Node.js",
  "Vite",
];

export function Stack() {
  return (
    <section id="stack" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="02" label="Stack" title="Стек." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stack.map((name, i) => (
          <Reveal key={name} delay={i * 0.06}>
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-6 py-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/50 hover:bg-cyan-400/[0.04] hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]">
              <div className="flex items-center justify-between">
                <p
                  className="font-display tracking-tight text-slate-100 transition-colors group-hover:text-cyan-200"
                  style={{ fontSize: "1.35rem", fontWeight: 500 }}
                >
                  {name}
                </p>
                <span className="font-mono text-xs text-cyan-400/40 transition-colors group-hover:text-cyan-300">
                  0{i + 1}
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
