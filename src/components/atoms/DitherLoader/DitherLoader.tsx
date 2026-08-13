"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../../lib/cn";

const DITHER_CELLS = Array.from({ length: 16 }, (_, index) => index);

type DitherLoaderProps = {
  label?: string;
  className?: string;
};

export function DitherLoader({
  label = "Loading",
  className,
}: DitherLoaderProps) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-label={label}
      className={cn(
        "inline-flex flex-col items-center gap-4 text-center",
        className,
      )}
      role="status"
    >
      <span
        aria-hidden="true"
        className="grid grid-cols-4 gap-1"
        data-testid="dither-loader-grid"
      >
        {DITHER_CELLS.map((cell) => (
          <motion.span
            key={cell}
            animate={reduce ? undefined : { opacity: [0.12, 1, 0.12] }}
            className="size-2 bg-primary"
            transition={
              reduce
                ? undefined
                : {
                    delay: ((cell % 4) + Math.floor(cell / 4)) * 0.08,
                    duration: 0.76,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                  }
            }
          />
        ))}
      </span>
      <span aria-hidden="true" className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        {label}
      </span>
    </div>
  );
}
