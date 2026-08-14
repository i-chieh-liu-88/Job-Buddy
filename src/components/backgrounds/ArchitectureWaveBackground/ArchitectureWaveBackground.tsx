import { cn } from "../../../lib/cn";

const SPLINE_SCENE_URL =
  "https://my.spline.design/gradientspherecopycopy-ZzSuZfTkcxJU4I5ViVrR66rU-VZS/";

export function ArchitectureWaveBackground({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="architecture-wave-background"
      className={cn("relative isolate overflow-hidden bg-black", className)}
    >
      <iframe
        data-testid="architecture-spline-scene"
        title=""
        src={SPLINE_SCENE_URL}
        className="absolute inset-x-0 top-0 h-[calc(100%+4rem)] w-full border-0 grayscale brightness-[0.72] contrast-[1.18]"
        loading="lazy"
        tabIndex={-1}
      />
      <div
        data-testid="architecture-primary-tint"
        className="pointer-events-none absolute inset-0 bg-[#818cf8] mix-blend-color"
      />
      <div
        data-testid="architecture-sphere-edge-softener"
        className="pointer-events-none absolute inset-x-[14%] top-[31%] h-[25%] bg-black/[0.035] backdrop-blur-[1.5px] [mask-image:radial-gradient(ellipse_at_center,black_16%,rgba(0,0,0,0.82)_42%,transparent_72%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_16%,rgba(0,0,0,0.82)_42%,transparent_72%)]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,transparent_0%,rgba(0,0,0,0.08)_48%,rgba(0,0,0,0.64)_100%)]" />
      <div className="pointer-events-none absolute inset-x-5 top-5 z-10 flex items-center gap-2 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-primary/80">
        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_#818cf8]" />
        Active pipeline
      </div>
    </div>
  );
}
