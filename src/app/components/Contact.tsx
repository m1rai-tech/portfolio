import { useState } from "react";
import { Send } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";
import { Socials } from "./Socials";

export function Contact() {
  const [form, setForm] = useState({ name: "", contact: "", type: "", budget: "", message: "" });
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3500);
    setForm({ name: "", contact: "", type: "", budget: "", message: "" });
  };

  return (
    <section id="contact" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="04" label="Contact" title="Контакти." />
      <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <div className="space-y-8">
            <p className="text-lg text-slate-300 leading-relaxed">
              Маєш ідею або проєкт?<br />Напиши — відповім швидко.
            </p>
            <div className="space-y-2 font-mono text-sm">
              <p className="text-slate-300">
                <span className="text-cyan-400/70">tg</span>
                <span className="mx-2 text-slate-600">→</span>
                <a className="hover:text-cyan-300 transition-colors" href="https://t.me/akirasata" target="_blank" rel="noreferrer">@akirasata</a>
              </p>
              <p className="text-slate-300">
                <span className="text-cyan-400/70">ig</span>
                <span className="mx-2 text-slate-600">→</span>
                <a className="hover:text-cyan-300 transition-colors" href="https://instagram.com/nxidetx" target="_blank" rel="noreferrer">nxidetx</a>
              </p>
              <p className="text-slate-300">
                <span className="text-cyan-400/70">dc</span>
                <span className="mx-2 text-slate-600">→</span>
                <span className="text-slate-300">_sen0_</span>
              </p>
            </div>
            <Socials size="lg" />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ім'я" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
              <Field label="Telegram / Email" value={form.contact} onChange={(v) => setForm((f) => ({ ...f, contact: v }))} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Тип роботи"
                value={form.type}
                onChange={(v) => setForm((f) => ({ ...f, type: v }))}
                options={["Лендінг", "Веб-застосунок", "Electron-застосунок", "API / бекенд", "Інше"]}
              />
              <Select
                label="Бюджет"
                value={form.budget}
                onChange={(v) => setForm((f) => ({ ...f, budget: v }))}
                options={["< $200", "$200–500", "$500–1000", "$1000+"]}
              />
            </div>
            <Field label="Опис проекту" value={form.message} onChange={(v) => setForm((f) => ({ ...f, message: v }))} multiline required />
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3.5 font-mono text-sm text-slate-950 transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]"
            >
              {sent ? "Надіслано ✓" : "Надіслати заявку"}
              {!sent && <Send size={14} className="transition-transform group-hover:translate-x-0.5" />}
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", multiline, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; multiline?: boolean; required?: boolean;
}) {
  const base = "w-full rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-cyan-400/[0.03]";
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs text-slate-500">{label}</span>
      {multiline
        ? <textarea rows={4} required={required} value={value} onChange={(e) => onChange(e.target.value)} className={`${base} resize-none`} />
        : <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className={base} />
      }
    </label>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/[0.07] bg-[#0a0e1a] px-4 py-2.5 text-sm text-slate-300 outline-none transition-all duration-200 focus:border-cyan-400/40"
      >
        <option value="">— обрати —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
