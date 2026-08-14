"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../../lib/cn";

type JobuddyLogoProps = {
  className?: string;
  compact?: boolean;
};

const SPRING_LOGO = { type: "spring" as const, stiffness: 380, damping: 24 };
const EYE_BOUNCE = {
  y: [0, 1.5, -7, 0, -3.25, 0],
  scaleY: [1, 0.82, 1.06, 0.94, 1.02, 1],
};

export function JobuddyLogo({ className, compact = false }: JobuddyLogoProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.span
      aria-label="Jobuddy"
      className={cn("inline-flex items-center gap-2", className)}
      initial="rest"
      animate="rest"
      whileHover={reduce ? undefined : "hover"}
      variants={{
        rest: { scale: 1 },
        hover: { scale: 1.015 },
      }}
      transition={SPRING_LOGO}
    >
      <motion.svg
        aria-hidden="true"
        data-testid="jobuddy-smile-mark"
        viewBox="0 0 48 48"
        className="size-6 shrink-0 overflow-visible text-primary"
        fill="none"
      >
        <path
          d="M48 48H24C37.255 48 48 37.255 48 24S37.255 0 24 0S0 10.745 0 24S10.745 48 24 48H0V0H48V48Z"
          fill="currentColor"
          fillRule="evenodd"
        />
        <motion.circle
          data-testid="jobuddy-logo-eye"
          cx="18"
          cy="21"
          r="3"
          fill="currentColor"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          variants={{ rest: { y: 0, scaleY: 1 }, hover: EYE_BOUNCE }}
          transition={{ duration: 0.64, times: [0, 0.12, 0.34, 0.56, 0.75, 1], ease: "easeOut" }}
        />
        <motion.circle
          data-testid="jobuddy-logo-eye"
          cx="30"
          cy="21"
          r="3"
          fill="currentColor"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          variants={{ rest: { y: 0, scaleY: 1 }, hover: EYE_BOUNCE }}
          transition={{ duration: 0.64, delay: 0.05, times: [0, 0.12, 0.34, 0.56, 0.75, 1], ease: "easeOut" }}
        />
      </motion.svg>

      {!compact ? (
        <span aria-hidden="true" className="font-display text-base font-semibold tracking-[-0.03em] text-ink">
          Jobuddy
        </span>
      ) : null}
    </motion.span>
  );
}
