import { useRef, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { content } from "../data/content";
import { Copy } from "./Copy";
import { SectionTitle } from "./SectionTitle";
import { useGlass } from "./Glass";

const ease = [0.22, 1, 0.36, 1] as const;
const highlights = ["react", "typescript", "electron"];

function Statement({ text, lang }: { text: string; lang: string }) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <motion.p
      lang={lang}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ staggerChildren: 0.028 }}
      className="max-w-[24ch] text-[clamp(1.75rem,3.8vw,3.25rem)] font-semibold leading-[1.16] tracking-[-0.025em] text-paper"
    >
      {words.map((word, index) => {
        const bare = word.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
        const accent = highlights.includes(bare);
        return (
          <span
            key={`${word}-${index}`}
            className="inline-flex overflow-hidden pb-[0.12em] align-top"
          >
            <motion.span
              variants={{
                hidden: { y: "110%" },
                show: { y: "0%", transition: { duration: 0.9, ease } },
              }}
              className={`inline-block ${accent ? "text-ember" : ""}`}
            >
              {word}
              {index < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        );
      })}
    </motion.p>
  );
}

function Monogram({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const glass = useGlass<HTMLDivElement>(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.4],
    reduce
      ? ["inset(-8% -8% -8% -8%)", "inset(-8% -8% -8% -8%)"]
      : ["inset(45% 0% 45% 0%)", "inset(-8% -8% -8% -8%)"],
  );
  const lettersY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["16%", "-16%"],
  );
  const glowY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["24%", "-24%"],
  );
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 160, damping: 18, mass: 0.6 });
  const rotateY = useSpring(tiltY, { stiffness: 160, damping: 18, mass: 0.6 });

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    tiltY.set(x * 12);
    tiltX.set(-y * 12);
  };
  const onLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ clipPath, perspective: 900 }}
      className="relative"
    >
      <motion.div
        ref={glass}
        role="img"
        aria-label={label}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX, rotateY }}
        className="glass glass-solid monogram-card group relative aspect-[4/5] w-full overflow-hidden rounded-[28px] [container-type:inline-size]"
      >
        <motion.div
          aria-hidden="true"
          style={{ y: glowY }}
          className="absolute -inset-[20%] bg-[radial-gradient(40%_32%_at_72%_78%,rgba(255,91,36,0.34),rgba(255,91,36,0)_70%),radial-gradient(46%_36%_at_20%_18%,rgba(122,92,255,0.22),rgba(122,92,255,0)_72%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-6 top-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-paper/40"
        >
          <span>akirasata</span>
          <span className="h-px w-10 bg-paper/25" />
        </div>
        <motion.div
          aria-hidden="true"
          style={{ y: lettersY }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="monogram-glow absolute font-display text-[40cqw] font-semibold leading-none tracking-[-0.07em]">
            DS
          </span>
          <span className="monogram relative font-display text-[40cqw] font-semibold leading-none tracking-[-0.07em]">
            DS
          </span>
        </motion.div>
        <span aria-hidden="true" className="monogram-sweep" />
      </motion.div>
    </motion.div>
  );
}

export function About() {
  const { t, language } = useLanguage();
  const reduce = useReducedMotion();
  return (
    <section
      id="about"
      className="relative mx-auto max-w-[90rem] px-6 py-28 md:px-10 md:py-40"
    >
      <SectionTitle section="about" />
      <Statement
        key={language}
        text={content[language].about.introduction}
        lang={content[language].htmlLang}
      />
      <div className="mt-20 grid gap-12 md:mt-28 md:grid-cols-12 md:gap-8">
        <figure className="md:col-span-5 lg:col-span-4">
          <Monogram label={t.about.name} />
          <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-xs">
            <span className="text-paper">
              <Copy select={(value) => value.about.name} />
            </span>
            <span className="text-paper/45">
              <Copy select={(value) => value.about.role} />
            </span>
          </figcaption>
        </figure>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease }}
          className="md:col-span-6 md:col-start-7 md:self-end lg:col-span-5 lg:col-start-8"
        >
          <p className="text-lg leading-relaxed text-paper/65 md:text-xl">
            <Copy
              select={(value) => value.about.description}
              className="w-full"
            />
          </p>
        </motion.div>
      </div>
      <ul className="mt-24 grid gap-10 sm:grid-cols-3 sm:gap-8 md:mt-32">
        {t.about.services.map((service, index) => (
          <motion.li
            key={service.id}
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, delay: index * 0.12, ease }}
            className="relative pt-6"
          >
            <motion.span
              aria-hidden="true"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.1, delay: index * 0.12, ease }}
              style={{ transformOrigin: "0% 50%" }}
              className="absolute inset-x-0 top-0 h-px bg-paper/15"
            />
            <h3 className="font-display text-base leading-[1.3] tracking-tight text-paper md:text-lg">
              <Copy select={(value) => value.about.services[index].title} />
            </h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/60">
              <Copy
                select={(value) => value.about.services[index].description}
                className="w-full"
              />
            </p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
