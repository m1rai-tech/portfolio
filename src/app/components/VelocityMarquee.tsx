import { useRef, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

const wrap = (min: number, max: number, value: number) => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

export function VelocityMarquee({
  children,
  speed = 2,
  skew = true,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  skew?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const offset = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [-2500, 0, 2500], [6, 0, 6]);
  const skewX = useTransform(
    smooth,
    [-2500, 2500],
    skew && !reduce ? [10, -10] : [0, 0],
  );
  const x = useTransform(offset, (value) => `${wrap(-50, 0, value)}%`);
  const visible = useRef(true);

  useAnimationFrame((_, delta) => {
    if (reduce || !visible.current) return;
    const step = Math.min(delta, 64) / 1000;
    offset.set(offset.get() + speed * step * (1 + boost.get()));
  });

  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      onViewportEnter={() => {
        visible.current = true;
      }}
      onViewportLeave={() => {
        visible.current = false;
      }}
    >
      <motion.div style={{ x, skewX }} className="flex w-max will-change-transform">
        <div className="flex shrink-0 items-center">{children}</div>
        <div aria-hidden="true" className="flex shrink-0 items-center">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
