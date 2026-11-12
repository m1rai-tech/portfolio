import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight, Github } from "lucide-react";
import { works, type Work } from "../data/works";
import { socialLinks } from "../data/socials";
import { useLanguage } from "../context/LanguageContext";
import { Copy } from "./Copy";
import { ProjectImage } from "./ProjectImage";
import { Reveal } from "./Reveal";
import { SectionTitle } from "./SectionTitle";
import { press, useGlass } from "./Glass";

export function Works() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  return (
    <section
      id="works"
      className="relative mx-auto max-w-[90rem] px-4 pt-24 md:px-10 md:pt-36"
    >
      <div className="px-2 md:px-0">
        <SectionTitle section="works" />
      </div>
      <div ref={ref}>
        {works.map((work, index) => (
          <Card
            key={work.id}
            work={work}
            index={index}
            total={works.length}
            progress={scrollYProgress}
          />
        ))}
      </div>
      <Reveal className="mt-24 px-2 md:mt-32 md:px-0">
        <a
          href={socialLinks.github.href}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between gap-6 border-y border-paper/10 py-8 md:py-12"
        >
          <span className="min-w-0">
            <span className="font-display block text-[clamp(1.6rem,4.5vw,4rem)] font-medium leading-[1.12] tracking-tight text-paper transition-colors duration-300 group-hover:text-ember">
              <Copy select={(value) => value.works.githubCard.title} />
            </span>
            <span className="mt-3 block text-sm text-paper/55">
              <Copy select={(value) => value.works.githubCard.description} />
            </span>
          </span>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-paper/20 text-paper transition-all duration-500 group-hover:rotate-45 group-hover:border-ember group-hover:bg-ember group-hover:text-ink md:h-20 md:w-20">
            <ArrowUpRight size={24} aria-hidden="true" />
          </span>
        </a>
      </Reveal>
    </section>
  );
}

function Links({ work }: { work: Work }) {
  const codeGlass = useGlass<HTMLAnchorElement>(false);
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      {work.websiteUrl && (
        <a
          href={work.websiteUrl}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-ember"
        >
          <Copy select={(value) => value.works.modal.openWebsite} />
          <ArrowUpRight
            size={16}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:rotate-45"
          />
        </a>
      )}
      {work.codeUrl && (
        <motion.a
          ref={codeGlass}
          href={work.codeUrl}
          target="_blank"
          rel="noreferrer"
          {...press}
          className="glass glass-flat glass-press relative inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-paper transition-colors duration-300 hover:text-ember"
        >
          <Github size={16} aria-hidden="true" />
          <Copy select={(value) => value.works.modal.viewCode} />
        </motion.a>
      )}
    </div>
  );
}

function Card({
  work,
  index,
  total,
  progress,
}: {
  work: Work;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const wrapper = useRef<HTMLDivElement>(null);
  const behind = total - 1 - index;
  const start = index / total;
  const scale = useTransform(
    progress,
    [start, 1],
    [1, reduce ? 1 : 1 - behind * 0.035],
  );
  const shade = useTransform(
    progress,
    [start, 1],
    [0, reduce ? 0 : Math.min(behind * 0.14, 0.65)],
  );
  const { scrollYProgress: enter } = useScroll({
    target: wrapper,
    offset: ["start end", "start start"],
  });
  const imageScale = useTransform(enter, [0, 1], [reduce ? 1 : 1.3, 1]);
  const rotate = useTransform(
    enter,
    [0, 1],
    [reduce ? 0 : index % 2 ? 4 : -4, 0],
  );
  const href = work.websiteUrl ?? work.codeUrl;

  return (
    <div ref={wrapper} className="sticky top-0 flex h-[100svh] items-center">
      <motion.article
        style={{ scale, rotate, top: index * 14 }}
        className="relative flex w-full origin-top flex-col overflow-hidden rounded-[28px] border border-paper/10 bg-ink-2 shadow-[0_-30px_80px_rgba(0,0,0,0.45)] lg:h-[76vh] lg:flex-row"
      >
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={t.works.projects[work.id].title}
          data-cursor={t.works.cursor}
          className="group relative m-2 md:cursor-none block aspect-[16/10] overflow-hidden rounded-[20px] bg-ink lg:order-last lg:m-3 lg:aspect-auto lg:flex-1"
        >
          <motion.div style={{ scale: imageScale }} className="absolute inset-0">
            <ProjectImage
              src={work.coverImage}
              alt={t.works.projects[work.id].previewAlt}
              className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
            />
          </motion.div>
          <span className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-ember text-ink transition-transform duration-500 group-hover:scale-0 md:h-16 md:w-16">
            <ArrowUpRight size={22} aria-hidden="true" />
          </span>
        </a>
        <div className="flex flex-col justify-between gap-6 p-6 md:p-10 lg:w-[42%]">
          <div>
            <p className="flex items-center justify-between gap-4 font-mono text-xs uppercase tracking-[0.16em] text-paper/50">
              <span>{work.year}</span>
              <Copy select={(value) => value.works.projectTypes[work.type]} />
            </p>
            <h3 className="font-display mt-6 text-[clamp(1.5rem,2.8vw,2.6rem)] font-medium leading-[1.12] tracking-tight text-paper">
              <Copy select={(value) => value.works.projects[work.id].title} />
            </h3>
            <p className="mt-5 text-sm leading-relaxed text-paper/65 md:text-base">
              <Copy
                select={(value) => value.works.projects[work.id].description}
                className="w-full"
              />
            </p>
          </div>
          <div>
            <ul className="flex flex-wrap gap-2">
              {work.stack.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-paper/15 px-3 py-1 font-mono text-[11px] text-paper/70"
                >
                  {tech}
                </li>
              ))}
            </ul>
            <Links work={work} />
          </div>
        </div>
        <motion.div
          aria-hidden="true"
          style={{ opacity: shade }}
          className="pointer-events-none absolute inset-0 bg-ink"
        />
      </motion.article>
    </div>
  );
}
