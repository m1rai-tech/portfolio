import { CheckCircle, MessageCircle, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

const stats = [
  { label: "Вік", value: "19 років" },
  { label: "Стек", value: "React TS" },
  { label: "Досвід", value: "~1 рік" },
  { label: "Напрямок", value: "AI Eng." },
];

const traits = [
  {
    icon: CheckCircle,
    title: "Vibe Coding",
    desc: "Будую сайти та додатки через AI-асистовану розробку — швидко, чисто, з повним контролем результату",
  },
  {
    icon: MessageCircle,
    title: "Prompt Engineering",
    desc: "Пишу чіткі промти та покращую AI-workflow — менше шуму, більше точних результатів",
  },
  {
    icon: Sparkles,
    title: "AI-first підхід",
    desc: "Шукаю діри в AI-пайплайнах і закриваю їх — безпека, логіка, стабільність",
  },
];

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="01" label="About" title="Про мене." />

      <div className="grid items-start gap-16 md:grid-cols-[280px_1fr]">
        <Reveal>
          <div className="mx-auto flex flex-col items-center md:mx-0">
            <div className="relative h-64 w-64">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/10 blur-2xl" />
              <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                <img
                  src={`${import.meta.env.BASE_URL}About.jpg`}
                  alt="Сторожук Данило"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-xl font-semibold tracking-tight text-slate-100">
                Сторожук Данило
              </h3>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.25em] text-cyan-400">
                AI Engineer • Frontend Developer
              </p>
            </div>
          </div>
        </Reveal>

        <div className="md:pt-1 space-y-8">
          <Reveal delay={0.1}>
            <div className="space-y-3 max-w-xl">
              <p className="text-xl leading-relaxed text-slate-200">
                Привіт, я{" "}
                <span className="font-semibold text-cyan-400">Данило</span>.
                Створюю веб-сайти та веб-додатки через vib  e coding і prompt engineering —
                від ідеї до продакшену через чітку роботу з AI.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-medium text-cyan-300">
                  Відкритий до нових проектів
                </span>
              </div>
              <p className="text-base leading-relaxed text-slate-400">
                Пишу на React + TypeScript, працюю з Electron і рухаюсь у бік AI Engineering.
                Моя фішка — чіткі промти, покращення AI-workflow і закриття дір у роботі з моделями.
                Реальний досвід із Supabase, Vercel, Stripe.
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