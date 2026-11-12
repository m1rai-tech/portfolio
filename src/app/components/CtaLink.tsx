import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Magnetic } from "./Magnetic";
import { press, useGlass } from "./Glass";

export function CtaLink({
  href,
  children,
  icon,
  variant = "solid",
  external = false,
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "solid" | "outline";
  external?: boolean;
}) {
  const solid = variant === "solid";
  const glass = useGlass<HTMLAnchorElement>(!solid);
  return (
    <Magnetic strength={0.22}>
      <motion.a
        ref={solid ? undefined : glass}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        {...press}
        className={`group relative isolate inline-flex h-16 items-center overflow-hidden rounded-full px-8 text-base font-semibold transition-colors duration-500 md:h-[4.75rem] md:px-10 md:text-lg ${solid ? "gloss bg-ember text-ink" : "glass glass-press text-paper hover:text-ink"}`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 translate-y-[101%] rounded-[inherit] bg-paper transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
        />
        <span className="flex items-center gap-3">
          {children}
          {icon}
        </span>
      </motion.a>
    </Magnetic>
  );
}
