import { motion, useInView } from "motion/react";
import { useRef, type CSSProperties } from "react";

export function AnimatedHeading({
  text,
  className = "",
  style,
  as: Tag = "h2",
  delay = 0,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2" | "h3";
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(" ");

  return (
    <Tag ref={ref as never} className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex flex-wrap" style={{ rowGap: "0.15em" }}>
        {words.map((w, wi) => (
          <span key={wi} className="mr-[0.25em] inline-flex overflow-hidden whitespace-nowrap">
            {w.split("").map((ch, ci) => (
              <motion.span
                key={ci}
                initial={{ y: "110%", opacity: 0 }}
                animate={inView ? { y: 0, opacity: 1 } : {}}
                transition={{
                  duration: 0.6,
                  delay: delay + wi * 0.05 + ci * 0.025,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block"
                style={{ willChange: "transform, opacity" }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  );
}
