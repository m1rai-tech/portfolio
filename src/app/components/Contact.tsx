import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { Copy } from "./Copy";
import { CtaLink } from "./CtaLink";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";
import { socialLinks } from "../data/socials";
import { Glass } from "./Glass";

export function Contact() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center 0.55"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.55, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [reduce ? 1 : 0, 1]);

  return (
    <section
      id="contact"
      className="relative mx-auto max-w-[90rem] px-6 py-24 md:px-10 md:py-40"
    >
      <SectionTitle section="contact" />
      <div ref={ref}>
        <motion.h3
          style={{ scale, opacity }}
          className="font-display origin-bottom-left text-[clamp(2.3rem,7vw,7.5rem)] font-medium leading-[1.06] tracking-[-0.02em] text-paper"
        >
          <Copy select={(value) => value.contact.heading} className="w-full" />
        </motion.h3>
      </div>
      <div className="mt-14 grid gap-16 md:mt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <Reveal>
          <p className="max-w-lg text-base leading-relaxed text-paper/65 md:text-lg">
            <Copy
              select={(value) => value.contact.description}
              className="w-full"
            />
          </p>
          <div className="mt-10">
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
              <Copy select={(value) => value.contact.action} />
            </CtaLink>
          </div>
          <ul
            aria-label={t.contact.processLabel}
            className="mt-16 grid gap-8 sm:grid-cols-3 sm:gap-6"
          >
            {t.contact.steps.map((step, index) => (
              <li key={step.id} className="border-t border-paper/15 pt-5">
                <p className="text-sm font-semibold text-paper">
                  <Copy select={(value) => value.contact.steps[index].title} />
                </p>
                <p className="mt-2 text-sm leading-relaxed text-paper/55">
                  <Copy
                    select={(value) => value.contact.steps[index].description}
                    className="w-full"
                  />
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-paper/50">
            <Copy select={(value) => value.contact.otherContacts} />
          </p>
          <div className="border-t border-paper/10">
            {(Object.keys(socialLinks) as (keyof typeof socialLinks)[]).map(
              (id) => (
                <a
                  key={id}
                  href={socialLinks[id].href}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative isolate flex items-center justify-between gap-4 border-b border-paper/10 py-6"
                >
                  <Glass
                    as="span"
                    aria-hidden="true"
                    className="glass-press pointer-events-none invisible absolute -inset-x-4 inset-y-2 -z-10 rounded-[1.25rem] opacity-0 transition-[opacity,visibility] duration-500 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 md:-inset-x-5"
                  />
                  <span className="min-w-0">
                    <span className="font-display block text-xl text-paper transition-colors duration-300 group-hover:text-ember md:text-2xl">
                      {t.brands[id]}
                    </span>
                    <span className="mt-2 block font-mono text-xs text-paper/50">
                      {socialLinks[id].handle} —{" "}
                      <Copy select={(value) => value.contact.channels[id]} />
                    </span>
                  </span>
                  <ArrowUpRight
                    size={22}
                    aria-hidden="true"
                    className="shrink-0 text-paper/50 transition duration-500 group-hover:rotate-45 group-hover:text-ember"
                  />
                </a>
              ),
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
