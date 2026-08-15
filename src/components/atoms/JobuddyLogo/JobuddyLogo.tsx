"use client";

import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { cn } from "../../../lib/cn";

type JobuddyLogoProps = {
  className?: string;
  compact?: boolean;
};

const MARK_TRANSITION = {
  duration: 0.56,
  ease: "easeOut" as const,
  times: [0, 0.34, 0.64, 0.82, 1],
};

export function JobuddyLogo({ className, compact = false }: JobuddyLogoProps) {
  const reduce = useReducedMotion() ?? false;
  const markControls = useAnimationControls();

  const animateMark = () => {
    if (reduce) return;

    void markControls.start({
      rotate: [0, 30, -8, 4, 0],
      transition: MARK_TRANSITION,
    });
  };

  return (
    <span
      aria-label="Jobuddy"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <motion.svg
        aria-hidden="true"
        data-testid="jobuddy-mark"
        viewBox="0 0 256 256"
        className="size-6 shrink-0 overflow-visible text-primary"
        fill="none"
        animate={markControls}
        initial={{ rotate: 0 }}
        onMouseEnter={animateMark}
        style={{ transformOrigin: "center" }}
      >
        <path
          data-testid="jobuddy-mark-path"
          d="M 192 0 C 227.346 0 256 28.654 256 64 C 256 99.346 227.346 128 192 128 C 227.346 128 256 156.654 256 192 C 256 227.346 227.346 256 192 256 C 156.654 256 128 227.346 128 192 C 128 227.346 99.346 256 64 256 C 28.654 256 0 227.346 0 192 C 0 156.654 28.654 128 64 128 C 28.654 128 0 99.346 0 64 C 0 28.654 28.654 0 64 0 C 99.346 0 128 28.654 128 64 C 128 28.654 156.654 0 192 0 Z M 128 100 C 112.536 100 100 112.536 100 128 C 100 143.464 112.536 156 128 156 C 143.464 156 156 143.464 156 128 C 156 112.536 143.464 100 128 100 Z"
          fill="currentColor"
        />
      </motion.svg>

      {!compact ? (
        <span
          aria-hidden="true"
          className="font-display text-base font-semibold tracking-[-0.03em] text-ink"
          onMouseEnter={animateMark}
        >
          Jobuddy
        </span>
      ) : null}
    </span>
  );
}
