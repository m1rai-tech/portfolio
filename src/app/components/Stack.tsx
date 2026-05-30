import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

const stack = [
  { name: "React", note: "основний фреймворк" },
  { name: "Next.js", note: "повностековий" },
  { name: "TypeScript", note: "завжди" },
  { name: "Supabase", note: "auth, db, realtime" },
  { name: "Vercel AI SDK", note: "стрімінг, агенти" },
  { name: "Electron", note: "десктоп-застосунки" },
  { name: "Node.js", note: "бекенд, API" },
  { name: "Vite", note: "збірка" },
  { name: "Vibe Coding", note: "AI-assisted розробка" },
];

export function Stack() {
  return (
    <section id="stack" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="02" label="Stack" title="Стек." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stack.map((item, i) => (
          <Reveal key={item.name} delay={i * 0.05}>
            <div className="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]">
              <div>
                <p className="font-display text-[1.05rem] font-medium text-slate-100 tracking-tight">
                  {item.name}
                </p>
                <p className="mt-0.5 font-mono text-xs text-slate-500">{item.note}</p>
              </div>
              <span className="font-mono text-xs text-white/10 group-hover:text-white/20 transition-colors">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
