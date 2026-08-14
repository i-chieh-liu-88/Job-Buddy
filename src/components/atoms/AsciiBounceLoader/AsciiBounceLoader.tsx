"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../../../lib/cn";

const ASCII_BOUNCE_FRAMES = ["⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"] as const;

type AsciiBounceLoaderProps = {
  label?: string;
  size?: number;
  speed?: number;
  className?: string;
};

export function AsciiBounceLoader({
  label = "Loading",
  size = 64,
  speed = 1,
  className,
}: AsciiBounceLoaderProps) {
  const reduce = useReducedMotion() ?? false;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const cycleSeconds = reduce ? speed * 2.5 : speed;
    const stepMilliseconds = (cycleSeconds / ASCII_BOUNCE_FRAMES.length) * 1000;
    const intervalId = window.setInterval(() => {
      setFrame((currentFrame) => (currentFrame + 1) % ASCII_BOUNCE_FRAMES.length);
    }, stepMilliseconds);

    return () => window.clearInterval(intervalId);
  }, [reduce, speed]);

  return (
    <span
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-primary", className)}
      role="status"
    >
      <span
        aria-hidden="true"
        className="font-mono leading-none tabular-nums"
        data-testid="ascii-bounce-loader-glyph"
        style={{ fontSize: size, lineHeight: 1 }}
      >
        {ASCII_BOUNCE_FRAMES[frame]}
      </span>
    </span>
  );
}
