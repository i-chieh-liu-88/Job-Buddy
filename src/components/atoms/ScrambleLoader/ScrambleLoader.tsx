import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "../../../lib/cn";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$?/\\";

function scrambleText(text: string) {
  return Array.from(text, (character) =>
    character === " "
      ? character
      : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
  ).join("");
}

type ScrambleLoaderProps = {
  label?: string;
  className?: string;
};

export function ScrambleLoader({
  label = "Loading",
  className,
}: ScrambleLoaderProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(label);

  useEffect(() => {
    if (reduce) return;

    const intervalId = window.setInterval(() => {
      setDisplay(scrambleText(label));
    }, 90);

    return () => window.clearInterval(intervalId);
  }, [label, reduce]);

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
        className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-primary motion-reduce:animate-pulse"
        data-testid="scramble-loader-display"
      >
        {display}
      </span>
      <span aria-hidden="true" className="flex gap-1.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none"
            style={{ animationDelay: `${dot * 140}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
