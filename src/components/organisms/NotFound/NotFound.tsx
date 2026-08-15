import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { WorkspaceEngineeringGrid } from "../../backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$?/\\";
const SCRAMBLE_MS = 700;
const TICK_MS = 45;

type NotFoundProps = {
  code?: string;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
  browseHref?: string;
  browseLabel?: string;
};

function Scramble({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (reduce) {
      return;
    }

    const chars = text.split("");
    const start = performance.now();
    let frame = 0;
    let last = 0;

    const loop = (now: number) => {
      if (now - last >= TICK_MS) {
        last = now;
        const progress = Math.min((now - start) / SCRAMBLE_MS, 1);
        const settled = Math.floor(progress * chars.length);
        setDisplay(
          chars
            .map((character, index) =>
              index < settled || character === " "
                ? character
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            )
            .join(""),
        );
      }
      if (now - start < SCRAMBLE_MS) frame = requestAnimationFrame(loop);
      else setDisplay(text);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [reduce, text]);

  return <span className="tabular-nums">{display}</span>;
}

function ActionLink({ href, children, primary = false }: { href: string; children: string; primary?: boolean }) {
  return (
    <a
      href={href}
      className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-xs font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
        primary
          ? "border-primary bg-primary text-[#0A0A0A] hover:bg-primary/85"
          : "border-line bg-surface text-ink hover:bg-hover"
      }`}
    >
      {children}
    </a>
  );
}

export function NotFound({
  code = "404",
  title = "Page not found",
  description = "This route drifted out of your application pipeline.",
  homeHref = "/",
  homeLabel = "Back to applications",
  browseHref = "/resumes",
  browseLabel = "Browse workspace",
}: NotFoundProps) {
  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-canvas px-6 py-16 text-ink">
      <WorkspaceEngineeringGrid />
      <section className="relative z-10 w-full max-w-xl border border-line bg-surface/90 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-12">
        <div className="group relative select-none font-mono text-[clamp(5rem,18vw,11rem)] font-bold leading-none tracking-tighter text-ink">
          <span aria-hidden className="pointer-events-none absolute inset-0 text-[#ff0040] opacity-0 mix-blend-screen transition-[transform,opacity] duration-150 ease-out group-hover:translate-x-[3px] group-hover:opacity-70 motion-reduce:hidden"><Scramble text={code} /></span>
          <span aria-hidden className="pointer-events-none absolute inset-0 text-[#00e5ff] opacity-0 mix-blend-screen transition-[transform,opacity] duration-150 ease-out group-hover:-translate-x-[3px] group-hover:opacity-70 motion-reduce:hidden"><Scramble text={code} /></span>
          <h1><Scramble text={code} /></h1>
        </div>
        <div className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted">{description}</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ActionLink href={homeHref} primary>{homeLabel}</ActionLink>
          <ActionLink href={browseHref}>{browseLabel}</ActionLink>
        </div>
      </section>
    </main>
  );
}
