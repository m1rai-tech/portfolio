import { CheckCircle, MessageCircle, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

const stats = [
  { label: "Вік", value: "19 років" },
  { label: "Освіта", value: "IT Step" },
  { label: "Досвід", value: "~1 рік" },
  { label: "Напрямок", value: "AI Eng." },
];

const traits = [
  { icon: CheckCircle, title: "Чіткий план", desc: "Перед стартом фіксуємо задачу, строки і очікування" },
  { icon: MessageCircle, title: "Консультація", desc: "Постійно в діалозі — розберу будь-яку задачу разом з тобою" },
  { icon: Sparkles, title: "Відкритий", desc: "Цікавлять будь-які проекти — від лендінгу до AI-продукту" },
];

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="01" label="About" title="Про мене." />

      <div className="grid items-start gap-12 md:grid-cols-[220px_1fr]">
        <Reveal>
          <div className="relative mx-auto h-52 w-52 md:mx-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/10 blur-2xl" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#0a0e1a]">
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "radial-gradient(circle at 30% 70%, rgba(59,130,246,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(6,182,212,0.3) 0%, transparent 50%)",
                }}
              />
              <span
                className="relative font-display select-none"
                style={{ fontSize: "3.5rem", fontWeight: 600, letterSpacing: "-0.04em", color: "rgba(226,232,240,0.85)" }}
              >
                a.s
              </span>
            </div>
          </div>
        </Reveal>

        <div className="md:pt-1 space-y-8">
          <Reveal delay={0.1}>
            <div className="space-y-3 max-w-xl">
              <p className="text-lg leading-relaxed text-slate-300">
                19 років. Закінчив IT Step, але більше навчився сам —
                з малечку цікавився технологіями, від ігор до коду.
              </p>
              <p className="text-base leading-relaxed text-slate-400">
                Зараз пишу на React + TypeScript, активно займаюсь Electron,
                і рухаюсь у бік AI Engineering. Працював над реальними проектами
                з Supabase, Vercel, Stripe — не тільки читав доку, а й застосовував.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="grid grid-cols-2 gap-3 max-w-sm sm:grid-cols-4 sm:max-w-2xl">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
                    {s.label}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-200">{s.value}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="grid gap-3 sm:grid-cols-3 max-w-2xl">
              {traits.map((t) => (
                <div
                  key={t.title}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <t.icon size={14} className="text-slate-500 shrink-0" />
                    <p className="text-sm font-medium text-slate-200">{t.title}</p>
                  </div>
                  <p className="font-mono text-xs leading-relaxed text-slate-500">
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
