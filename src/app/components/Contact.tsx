import { ArrowUpRight, Code2, FileText, Github, Instagram, MessageSquare, Send, Zap } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";

function DiscordIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const steps = [
  {
    icon: MessageSquare,
    num: "01",
    title: "Обговорення",
    desc: "Розкажи задачу — разом розберемось що потрібно і яким шляхом іти",
  },
  {
    icon: FileText,
    num: "02",
    title: "Оцінка + план",
    desc: "Фіксуємо обсяг, строки і вартість. Ніяких сюрпризів по дорозі",
  },
  {
    icon: Code2,
    num: "03",
    title: "Розробка + здача",
    desc: "Пишу код, тримаю в курсі прогрес, здаю готовий результат",
  },
];

const contacts = [
  {
    platform: "Telegram",
    handle: "@akirasata",
    href: "https://t.me/akirasata",
    note: "найшвидше",
    icon: <Send size={16} />,
    primary: true,
  },
  {
    platform: "Instagram",
    handle: "nxidetx",
    href: "https://instagram.com/nxidetx",
    note: "якщо цікаво хто я",
    icon: <Instagram size={16} />,
    primary: false,
  },
  {
    platform: "Discord",
    handle: "_sen0_",
    href: null,
    note: "теж є",
    icon: <DiscordIcon size={16} />,
    primary: false,
  },
  {
    platform: "GitHub",
    handle: "m1rai-tech",
    href: "https://github.com/m1rai-tech",
    note: "код тут",
    icon: <Github size={16} />,
    primary: false,
  },
];

export function Contact() {
  return (
    <section id="contact" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="04" label="Contact" title="Контакти." />

      {/* How I work — 3 steps */}
      <Reveal>
        <div className="mb-14 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.num} className="relative rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
              {i < steps.length - 1 && (
                <span className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-slate-700 sm:block">
                  →
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={13} className="text-slate-600 shrink-0" />
                <p className="font-mono text-xs text-slate-600">{s.num}</p>
              </div>
              <p className="text-sm font-medium text-slate-200">{s.title}</p>
              <p className="mt-1.5 font-mono text-xs leading-relaxed text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
        {/* Left — CTA */}
        <Reveal>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xl text-slate-300 leading-relaxed">
                Є ідея або проєкт?<br />
                Напиши — розберемось.
              </p>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                Відкритий до фріланс-замовлень,
                цікавих задач і розмов про код.
              </p>
            </div>

            {/* Response time badge */}
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-400/10 text-green-400">
                <Zap size={12} />
              </span>
              <span className="font-mono text-xs text-slate-500">
                відповідаю протягом 2–4 годин
              </span>
            </div>

            {/* Primary CTA */}
            <a
              href="https://t.me/akirasata"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-4 font-mono text-sm font-medium text-slate-950 transition-opacity hover:opacity-90"
            >
              <Send size={16} />
              Написати в Telegram
            </a>

            <p className="font-mono text-xs text-slate-600">
              або обери інший спосіб →
            </p>
          </div>
        </Reveal>

        {/* Right — contact list */}
        <Reveal delay={0.1}>
          <div className="space-y-1">
            {contacts.map((c, i) => (
              <div key={i}>
                {c.href ? (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`group flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200 ${
                      c.primary
                        ? "border border-cyan-400/20 bg-cyan-400/[0.04] hover:border-cyan-400/35 hover:bg-cyan-400/[0.07]"
                        : "border border-transparent hover:border-white/8 hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          c.primary
                            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-400"
                            : "border-white/10 bg-white/[0.04] text-slate-500 group-hover:text-slate-400"
                        } transition-colors`}
                      >
                        {c.icon}
                      </span>
                      <div>
                        <span className={`text-sm font-medium ${c.primary ? "text-slate-100" : "text-slate-200"}`}>
                          {c.handle}
                        </span>
                        <span className="ml-2 font-mono text-xs text-slate-600">{c.note}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:block font-mono text-xs text-slate-600">{c.platform}</span>
                      <ArrowUpRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center justify-between rounded-xl px-4 py-3.5 opacity-50">
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-600">
                        {c.icon}
                      </span>
                      <div>
                        <span className="text-sm text-slate-400">{c.handle}</span>
                        <span className="ml-2 font-mono text-xs text-slate-600">{c.note}</span>
                      </div>
                    </div>
                    <span className="hidden sm:block font-mono text-xs text-slate-600">{c.platform}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
