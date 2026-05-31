import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

const categories = [
  {
    label: "Frontend",
    items: [
      { name: "React", note: "основний" },
      { name: "Next.js", note: "fullstack" },
      { name: "TypeScript", note: "завжди" },
      { name: "Tailwind", note: "стилі" },
      { name: "Vite", note: "збірка" },
    ],
  },
  {
    label: "Backend / DB",
    items: [
      { name: "Node.js", note: "API, сервер" },
      { name: "Supabase", note: "db, auth, realtime" },
      { name: "Vercel AI SDK", note: "стрімінг, агенти" },
      { name: "Stripe", note: "оплата" },
    ],
  },
  {
    label: "Інструменти",
    items: [
      { name: "Electron", note: "десктоп-апки" },
      { name: "Vercel", note: "деплой" },
      { name: "Git / GitHub", note: "версії" },
      { name: "Vibe Coding", note: "AI-assisted dev" },
    ],
  },
];

export function Stack() {
  return (
    <section id="stack" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="02" label="Stack" title="Стек." />

      <div className="grid gap-6 sm:grid-cols-3">
        {categories.map((cat, ci) => (
          <Reveal key={cat.label} delay={ci * 0.08}>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600 mb-4">
                {cat.label}
              </p>
              <div className="space-y-1">
                {cat.items.map((item, ii) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="text-sm text-slate-200">{item.name}</span>
                    <span className="font-mono text-xs text-slate-600">{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
