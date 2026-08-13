"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { PointerEvent } from "react";
import { cn } from "../../../lib/cn";
import { SPRING_MOUSE } from "../../../lib/ease";
import { useHoverCapable } from "../../../lib/use-hover-capable";
import { Button, type ButtonProps } from "../StatefulButton/base";

const SUBTLE_PULL_DISTANCE = 8;
const SUBTLE_PULL_FACTOR = 0.14;

function clampPull(distance: number) {
  return Math.max(
    -SUBTLE_PULL_DISTANCE,
    Math.min(SUBTLE_PULL_DISTANCE, distance * SUBTLE_PULL_FACTOR),
  );
}

export function MagneticAddApplicationButton({
  children,
  className,
  disabled,
  ...buttonProps
}: ButtonProps) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING_MOUSE);
  const springY = useSpring(y, SPRING_MOUSE);
  const enabled = canHover && !reduce && !disabled;

  function resetPull() {
    x.set(0);
    y.set(0);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!enabled) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    x.set(clampPull(event.clientX - bounds.left - bounds.width / 2));
    y.set(clampPull(event.clientY - bounds.top - bounds.height / 2));
  }

  return (
    <motion.div
      className="inline-flex"
      onPointerLeave={resetPull}
      onPointerMove={handlePointerMove}
      style={enabled ? { x: springX, y: springY } : undefined}
    >
      <Button
        className={cn("cursor-pointer", className)}
        disabled={disabled}
        {...buttonProps}
      >
        {children}
      </Button>
    </motion.div>
  );
}
