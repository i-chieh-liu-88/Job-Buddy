import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../../lib/cn";

const signalHeights = [
  10, 14, 18, 24, 20, 29, 35, 42, 49, 57, 64,
  72, 78, 85, 92, 98, 92, 87, 80, 72, 66, 60,
  53, 48, 43, 38, 31, 37, 29, 23, 18, 14, 10,
  8, 6, 5, 4, 3, 2, 2, 1, 1, 1, 1,
] as const;

export function ArchitectureWaveBackground({
  className,
}: {
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      data-testid="architecture-wave-background"
      className={cn(
        "relative overflow-hidden bg-[#090a0f]",
        className,
      )}
    >
      <div className="absolute inset-x-5 top-5 flex items-center gap-2 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-primary/70">
        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_#818cf8]" />
        Active pipeline
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[82%] bg-[radial-gradient(ellipse_52%_92%_at_48%_100%,rgba(129,140,248,0.22),transparent_72%)]" />
      <div className="absolute inset-x-4 bottom-0 flex h-[88%] items-end gap-px sm:inset-x-6 sm:gap-0.5">
        {signalHeights.map((height, index) => {
          const smaller = Math.max(1, height - (index % 5) * 5 - 5);
          const larger = Math.min(100, height + ((index + 2) % 6) * 4 + 3);

          return (
            <motion.div
              key={index}
              data-testid="architecture-signal-bar"
              className="architecture-grid-pattern min-w-0 flex-1 border-x border-[#0a0a0a]/80 bg-[linear-gradient(rgba(228,232,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(228,232,255,0.16)_1px,transparent_1px),linear-gradient(to_top,rgba(129,140,248,0.2),rgba(129,140,248,0.78),#e4e8ff)] [background-size:100%_7px,7px_100%,100%_100%] shadow-[0_0_12px_rgba(129,140,248,0.22)]"
              initial={{ height: `${height}%` }}
              animate={
                reduce
                  ? { height: `${height}%` }
                  : {
                      height: [
                        `${height}%`,
                        `${larger}%`,
                        `${smaller}%`,
                        `${height}%`,
                      ],
                    }
              }
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      delay: (index % 13) * 0.11,
                      duration: 4.8 + (index % 7) * 0.24,
                      ease: [0.45, 0, 0.15, 1],
                      repeat: Infinity,
                    }
              }
            />
          );
        })}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(9,10,15,0.05),rgba(9,10,15,0.78)_10%,transparent_28%)]" />
      <svg
        data-testid="architecture-noise"
        className="pointer-events-none absolute inset-0 size-full opacity-[0.075] mix-blend-screen"
        aria-hidden="true"
      >
        <filter id="architecture-noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            seed="17"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#architecture-noise-filter)" />
      </svg>
    </div>
  );
}
