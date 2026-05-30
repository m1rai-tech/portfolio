import { Reveal } from "./Reveal";

export function PullQuote() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <blockquote className="relative">
          <span className="absolute -left-2 -top-8 font-display text-[8rem] leading-none text-cyan-500/15 select-none md:-left-6 md:-top-12 md:text-[12rem]">
            "
          </span>
          <p
            className="font-display max-w-4xl tracking-tight text-slate-100"
            style={{ fontSize: "clamp(1.6rem, 4.2vw, 3rem)", fontWeight: 500, lineHeight: 1.15 }}
          >
            гарний інтерфейс — це коли користувач не помічає, що там є інтерфейс.
            <span className="text-cyan-300"> а якщо помічає — то лише щоб усміхнутись.</span>
          </p>
          <footer className="mt-6 font-mono text-xs text-slate-500">
            — записав собі в нотатки в 2022, досі згоден
          </footer>
        </blockquote>
      </Reveal>
    </section>
  );
}
