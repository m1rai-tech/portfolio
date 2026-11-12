import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { socialLinks } from "../data/socials";
import { Copy } from "./Copy";
import { CtaLink } from "./CtaLink";
import { Socials } from "./Socials";
import { VelocityMarquee } from "./VelocityMarquee";
import { useGlass } from "./Glass";

const ease = [0.22, 1, 0.36, 1] as const;

function Chars({
  text,
  delay,
  className = "",
}: {
  text: string;
  delay: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <span
      aria-hidden="true"
      className={`inline-flex overflow-hidden pb-[0.14em] pt-[0.06em] ${className}`}
    >
      {Array.from(text).map((char, index) => (
        <motion.span
          key={index}
          className="inline-block origin-bottom-left"
          initial={reduce ? false : { y: "118%", rotate: 12 }}
          animate={{ y: "0%", rotate: 0 }}
          transition={{ duration: 1.15, delay: delay + index * 0.05, ease }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export function Hero() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const strip = useGlass<HTMLDivElement>(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const leftX = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduce ? "0%" : "-30%"],
  );
  const rightX = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduce ? "0%" : "30%"],
  );
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.35]);
  const nameOpacity = useTransform(scrollYProgress, [0.45, 1], [1, 0.1]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.38], [1, 0]);
  const lift = useTransform(scrollYProgress, [0, 0.38], [0, reduce ? 0 : -70]);
  const [first, ...rest] = t.hero.name.split(" ");
  const names = t.stack.categories.flatMap((category) =>
    category.items.map((item) => item.name),
  );
  const intro = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease },
  });

  return (
    <section ref={ref} id="hero" className="relative overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[90rem] flex-col justify-between gap-10 px-6 pb-28 pt-24 md:px-10 md:pb-28 md:pt-28">
        <motion.div style={{ opacity: fadeOut }}>
          <motion.div
            {...intro(0.1)}
            className="flex flex-wrap items-start justify-between gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.18em] text-paper/60"
          >
            <Copy select={(value) => value.hero.role} />
            <Copy select={(value) => value.hero.services} />
          </motion.div>
        </motion.div>

        <motion.h1
          style={{ opacity: nameOpacity }}
          aria-label={t.hero.name}
          className="font-display text-[20vw] sm:text-[clamp(3.4rem,13vw,13.5rem)] font-semibold leading-[0.92] tracking-[-0.035em] text-paper"
        >
          <motion.span style={{ x: leftX, scale }} className="block origin-left will-change-transform">
            <Chars text={first} delay={0.15} />
          </motion.span>
          <motion.span
            style={{ x: rightX, scale }}
            className="block origin-right text-right will-change-transform"
          >
            <Chars text={rest.join(" ")} delay={0.38} className="text-ember" />
          </motion.span>
        </motion.h1>

        <motion.div style={{ opacity: fadeOut, y: lift }}>
          <motion.div
            {...intro(0.75)}
            className="grid gap-8 lg:grid-cols-[minmax(0,27rem)_1fr] lg:items-end"
          >
            <div>
              <p className="text-base leading-relaxed text-paper/75 md:text-lg">
                <Copy
                  select={(value) => value.hero.description}
                  className="w-full"
                />
              </p>
              <div className="mt-6">
                <Socials />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <CtaLink
                href={socialLinks.telegram.href}
                external
                icon={
                  <ArrowUpRight
                    size={20}
                    aria-hidden="true"
                    className="transition-transform duration-500 group-hover:rotate-45"
                  />
                }
              >
                <Copy select={(value) => value.hero.writeAction} />
              </CtaLink>
              <CtaLink
                href="#works"
                variant="outline"
                icon={
                  <ArrowDown
                    size={20}
                    aria-hidden="true"
                    className="transition-transform duration-500 group-hover:translate-y-1"
                  />
                }
              >
                <Copy select={(value) => value.hero.worksAction} />
              </CtaLink>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div
        ref={strip}
        aria-hidden="true"
        className="glass glass-strip absolute inset-x-0 bottom-0 z-10 py-4"
      >
        <VelocityMarquee speed={-1.2} skew={false}>
          {names.map((name) => (
            <span
              key={name}
              className="flex items-center whitespace-nowrap font-mono text-sm uppercase tracking-[0.14em] text-paper/70"
            >
              <span className="px-6">{name}</span>
              <span className="text-ember">/</span>
            </span>
          ))}
        </VelocityMarquee>
      </div>
    </section>
  );
}
