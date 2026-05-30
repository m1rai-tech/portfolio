import { useState } from "react";
import { Send } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";
import { Socials } from "./Socials";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3500);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionTitle num="04" label="Contact" title="Контакти." />
      <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <div className="space-y-8">
            <p className="text-lg text-slate-300 leading-relaxed">
              Маєш ідею або проєкт? Напиши.
            </p>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Direct</p>
              <div className="mt-4 space-y-2 font-mono text-sm">
                <p className="text-slate-300">
                  <span className="text-cyan-400">tg</span> → <a className="hover:text-cyan-300 transition-colors" href="https://t.me/akirasata" target="_blank" rel="noreferrer">@akirasata</a>
                </p>
                <p className="text-slate-300">
                  <span className="text-cyan-400">ig</span> → <a className="hover:text-cyan-300 transition-colors" href="https://instagram.com/nxidetx" target="_blank" rel="noreferrer">nxidetx</a>
                </p>
              </div>
            </div>
            <Socials size="lg" />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <form
            onSubmit={onSubmit}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="relative space-y-5">
              <Field
                label="Ім'я"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                required
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                required
              />
              <Field
                label="Повідомлення"
                value={form.message}
                onChange={(v) => setForm((f) => ({ ...f, message: v }))}
                multiline
                required
              />
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-4 font-mono text-sm text-slate-950 transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]"
              >
                {sent ? "Надіслано ✓" : "Надіслати"}
                <Send size={15} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const base =
    "w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-slate-100 placeholder-slate-600 outline-none transition-all duration-300 focus:border-cyan-400/60 focus:bg-cyan-400/[0.04] focus:shadow-[0_0_30px_rgba(34,211,238,0.15)]";
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={5}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
    </label>
  );
}
