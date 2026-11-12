import { motion, useReducedMotion } from "framer-motion";
import { Copy } from "./Copy";

const ease = [0.22, 1, 0.36, 1] as const;

export function SectionTitle({
  section,
}: {
  num?: string;
  section: "about" | "stack" | "works" | "contact";
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className="mb-14 md:mb-20"
    >
      <motion.p
        variants={{
          hidden: { opacity: 0, x: -16 },
          show: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
        }}
        className="font-mono text-xs uppercase tracking-[0.22em] text-ember"
      >
        <Copy select={(t) => t.navigation[section]} />
      </motion.p>
      <h2 className="font-display mt-4 overflow-hidden pb-[0.14em] text-[clamp(2.2rem,5.6vw,5.25rem)] font-medium leading-[1.1] tracking-[-0.02em] text-paper">
        <motion.span
          className="block"
          variants={{
            hidden: { y: "115%" },
            show: { y: "0%", transition: { duration: 1.05, ease } },
          }}
        >
          <Copy select={(t) => t[section].title} className="w-full" />
        </motion.span>
      </h2>
      <motion.div
        aria-hidden="true"
        variants={{
          hidden: { scaleX: 0 },
          show: { scaleX: 1, transition: { duration: 1.3, delay: 0.15, ease } },
        }}
        className="mt-6 h-px origin-left bg-paper/15"
      />
    </motion.div>
  );
}
