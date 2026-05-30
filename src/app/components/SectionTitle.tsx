import { Reveal } from "./Reveal";
import { AnimatedHeading } from "./AnimatedHeading";

export function SectionTitle({ num, label, title }: { num: string; label: string; title: string }) {
  return (
    <Reveal>
      <div className="mb-12 md:mb-16">
        <p className="font-mono text-xs tracking-widest text-cyan-400/80">
          {num} / {label.toUpperCase()}
        </p>
        <AnimatedHeading
          text={title}
          className="font-display mt-3 tracking-tight text-slate-100"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600 }}
        />
        <div className="mt-4 h-px w-24 bg-gradient-to-r from-cyan-400 to-transparent" />
      </div>
    </Reveal>
  );
}
