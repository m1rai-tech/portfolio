import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="01" label="About" title="Про мене." />
      <div className="grid items-start gap-12 md:grid-cols-[260px_1fr]">
        <Reveal>
          <div className="relative mx-auto h-56 w-56 md:mx-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-400/20 blur-2xl" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950">
              <span className="font-display text-7xl font-light text-cyan-300/90">久</span>
            </div>
          </div>
        </Reveal>
        <div className="md:pt-2">
          <Reveal delay={0.1}>
            <p className="max-w-xl text-lg leading-relaxed text-slate-300">
              Пишу на React і Next.js з 2020-го, останнім часом — багато Electron.
              Люблю інтерфейси, які працюють тихо і швидко.
            </p>
          </Reveal>
          <div className="mt-10 grid max-w-xl gap-6 sm:grid-cols-2">
            <Reveal delay={0.2}>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-cyan-400/70">Досвід</p>
                <p className="mt-2 text-slate-200">~1 рік</p>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-cyan-400/70">Фокус</p>
                <p className="mt-2 text-slate-200">React · Next · Electron</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
