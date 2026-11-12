import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Copy } from "./Copy";
import { Socials } from "./Socials";
import { formatText } from "../data/content";

const handle = "akirasata";

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["45%", "0%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const fill = useTransform(
    scrollYProgress,
    [0.35, 1],
    ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"],
  );

  useEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    let frame = 0;
    const fit = () => {
      frame = 0;
      const current = parseFloat(getComputedStyle(text).fontSize);
      const width = text.offsetWidth;
      if (!current || !width) return;
      const next = (current * box.clientWidth * 0.98) / width;
      setFontSize(Math.min(next, window.innerWidth * 0.14));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(fit);
    };
    schedule();
    document.fonts?.ready.then(schedule).catch(() => {});
    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const wordStyle = {
    fontSize: fontSize ? `${fontSize}px` : "11vw",
  };

  return (
    <footer
      ref={footerRef}
      className="relative z-10 overflow-hidden border-t border-paper/10"
    >
      <div className="mx-auto max-w-[90rem] px-6 pt-20 md:px-10 md:pt-28">
        <div
          ref={boxRef}
          aria-hidden="true"
          className="w-full overflow-hidden px-[0.5%] pb-[2%] pt-[1%]"
        >
          <motion.div
            style={reduceMotion ? undefined : { y, scale }}
            className="relative origin-bottom"
          >
            <span
              ref={textRef}
              style={{
                ...wordStyle,
                WebkitTextStroke: "1px rgb(239 233 223 / 0.22)",
              }}
              className="inline-block whitespace-nowrap font-display leading-[1.15] tracking-[-0.03em] text-transparent select-none"
            >
              {handle}
            </span>
            <motion.span
              style={{
                ...wordStyle,
                clipPath: reduceMotion ? "inset(0% 0% 0% 0%)" : fill,
              }}
              className="absolute left-0 top-0 inline-block whitespace-nowrap font-display leading-[1.15] tracking-[-0.03em] text-ember select-none"
            >
              {handle}
            </motion.span>
          </motion.div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[90rem] flex-col gap-6 border-t border-paper/10 px-6 md:px-10 py-7 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1 font-mono text-xs text-paper/45 sm:flex-row sm:gap-6">
          <p>
            <Copy
              select={(t) =>
                formatText(t.footer.copyright, {
                  year: new Date().getFullYear(),
                })
              }
            />
          </p>
          <p>
            <Copy select={(t) => t.footer.credit} />
          </p>
        </div>
        <div className="flex items-center justify-between gap-6 md:justify-end">
          <Socials size="sm" />
          <a
            href="#hero"
            className="group inline-flex min-h-11 items-center gap-2 font-mono text-xs text-paper/60 transition-colors hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
          >
            <Copy select={(t) => t.footer.backToTop} />
            <ArrowUp
              size={14}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
