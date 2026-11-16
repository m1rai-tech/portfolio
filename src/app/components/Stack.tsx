import { useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { Copy } from "./Copy";
import { SectionTitle } from "./SectionTitle";
import { VelocityMarquee } from "./VelocityMarquee";
import { useGlass } from "./Glass";

function CategoryPanel({
  index,
  className,
}: {
  index: number;
  className: string;
}) {
  const { t } = useLanguage();
  const category = t.stack.categories[index];
  const glass = useGlass<HTMLElement>(false);
  return (
    <article
      ref={glass}
      className={`glass glass-solid relative flex flex-col justify-between rounded-[28px] p-7 md:p-10 ${className}`}
    >
      <div>
        <h3 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-paper md:text-3xl">
          <Copy select={(value) => value.stack.categories[index].title} />
        </h3>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/70 md:text-base">
          <Copy
            select={(value) => value.stack.categories[index].summary}
            className="w-full"
          />
        </p>
      </div>
      <ul className="mt-10">
        {category.items.map((item, itemIndex) => (
          <li
            key={item.id}
            className="group flex items-baseline justify-between gap-6 border-t border-paper/10 py-4 last:pb-0"
          >
            <span className="text-lg font-semibold text-paper transition-colors duration-300 group-hover:text-ember md:text-xl">
              {item.name}
            </span>
            <span className="text-right font-mono text-[11px] leading-relaxed text-paper/60">
              <Copy
                select={(value) =>
                  value.stack.categories[index].items[itemIndex].description
                }
              />
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Pinned() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const distanceRef = useRef(0);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      const next = Math.max(0, element.offsetWidth - window.innerWidth);
      distanceRef.current = next;
      setDistance(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, (value) => -value * distanceRef.current);

  return (
    <div
      ref={ref}
      className="relative"
      style={{ height: `calc(100svh + ${distance}px)` }}
    >
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <motion.div
          ref={track}
          style={{ x }}
          className="flex w-max items-stretch gap-5 px-6 will-change-transform [backface-visibility:hidden] md:gap-8 md:px-10 xl:pl-[max(2.5rem,calc((100vw-90rem)/2+2.5rem))]"
        >
          <div className="flex w-[82vw] shrink-0 flex-col justify-center sm:w-[60vw] lg:w-[32rem]">
            <SectionTitle section="stack" />
          </div>
          {t.stack.categories.map((category, index) => (
            <CategoryPanel
              key={category.id}
              index={index}
              className="min-h-[min(60svh,540px)] w-[82vw] shrink-0 sm:w-[60vw] lg:w-[33rem]"
            />
          ))}
          <div className="w-[8vw] shrink-0" />
        </motion.div>
        <div className="mx-6 mt-10 h-px bg-paper/10 md:mx-10">
          <motion.div
            style={{ scaleX: scrollYProgress }}
            className="h-full origin-left bg-ember"
          />
        </div>
      </div>
    </div>
  );
}

function StaticGrid() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-[90rem] px-6 md:px-10">
      <SectionTitle section="stack" />
      <div className="grid gap-5 md:grid-cols-2">
        {t.stack.categories.map((category, index) => (
          <CategoryPanel key={category.id} index={index} className="min-h-80" />
        ))}
      </div>
    </div>
  );
}

export function Stack() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const names = t.stack.categories.flatMap((category) =>
    category.items.map((item) => item.name),
  );
  const word =
    "font-display whitespace-nowrap px-[0.3em] py-[0.14em] text-[clamp(2.6rem,8vw,7.5rem)] font-semibold leading-[1.18] tracking-tight";

  return (
    <section id="stack" className="relative pt-24 md:pt-36">
      <div aria-hidden="true" className="select-none">
        <VelocityMarquee speed={-2.4}>
          {names.map((name) => (
            <span
              key={name}
              className={`${word} text-transparent [-webkit-text-stroke:1.5px_rgba(239,233,223,0.38)]`}
            >
              {name}
            </span>
          ))}
        </VelocityMarquee>
        <VelocityMarquee speed={1.8}>
          {[...names].reverse().map((name) => (
            <span key={name} className="flex items-center">
              <span className={`${word} text-paper`}>{name}</span>
              <span className="font-display text-[clamp(1.6rem,4vw,3.5rem)] text-ember">
                ✦
              </span>
            </span>
          ))}
        </VelocityMarquee>
      </div>
      <div className="mt-10 md:mt-16">{reduce ? <StaticGrid /> : <Pinned />}</div>
    </section>
  );
}
