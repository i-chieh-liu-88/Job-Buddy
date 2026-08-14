"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../../lib/cn";
import { EASE_IN_OUT } from "../../../lib/ease";

const NEWTON_BALLS = [0, 1, 2, 3, 4] as const;

type NewtonLoaderProps = {
  label?: string;
  size?: number;
  speed?: number;
  className?: string;
};

export function NewtonLoader({
  label = "Loading",
  size = 64,
  speed = 1,
  className,
}: NewtonLoaderProps) {
  const reduce = useReducedMotion() ?? false;
  const diameter = size * 0.2;
  const travel = diameter * 1.1;
  const moves: Partial<
    Record<(typeof NEWTON_BALLS)[number], { x: number[]; times: number[] }>
  > = {
    0: { x: [0, -travel, 0, 0], times: [0, 0.28, 0.5, 1] },
    4: { x: [0, 0, travel, 0], times: [0, 0.5, 0.78, 1] },
  };

  return (
    <span
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-primary", className)}
      role="status"
    >
      <span
        aria-hidden="true"
        className="flex items-center justify-center"
        data-testid="newton-loader-balls"
        style={{ height: diameter }}
      >
        {NEWTON_BALLS.map((index) => {
          const move = moves[index];

          return (
            <motion.span
              animate={reduce || !move ? undefined : { x: move.x }}
              className="rounded-full bg-current"
              data-testid="newton-loader-ball"
              key={index}
              style={{ width: diameter, height: diameter }}
              transition={
                reduce || !move
                  ? undefined
                  : {
                      duration: speed * 1.5,
                      ease: EASE_IN_OUT,
                      repeat: Number.POSITIVE_INFINITY,
                      times: move.times,
                    }
              }
            />
          );
        })}
      </span>
    </span>
  );
}
