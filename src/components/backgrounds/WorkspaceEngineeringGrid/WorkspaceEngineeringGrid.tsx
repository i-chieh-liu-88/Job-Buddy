import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const GRID_SIZE = 124;

type HoverCell = {
  active: boolean;
  patternDirection: "forward" | "mirrored";
  x: number;
  y: number;
};

export function WorkspaceEngineeringGrid() {
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [hoverCell, setHoverCell] = useState<HoverCell>({
    active: false,
    patternDirection: "forward",
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (prefersReducedMotion) return;

    const hideHoverCell = () => {
      setHoverCell((current) =>
        current.active ? { ...current, active: false } : current,
      );
    };

    const updateHoverCell = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        hideHoverCell();
        return;
      }

      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;

      if (
        localX < 0 ||
        localY < 0 ||
        localX > rect.width ||
        localY > rect.height
      ) {
        hideHoverCell();
        return;
      }

      const column = Math.floor(localX / GRID_SIZE);
      const row = Math.floor(localY / GRID_SIZE);
      const x = column * GRID_SIZE;
      const y = row * GRID_SIZE;
      const patternDirection =
        (column + row) % 2 === 0 ? "forward" : "mirrored";

      setHoverCell((current) =>
        current.active &&
        current.x === x &&
        current.y === y &&
        current.patternDirection === patternDirection
          ? current
          : { active: true, patternDirection, x, y },
      );
    };

    window.addEventListener("pointermove", updateHoverCell, { passive: true });
    window.addEventListener("blur", hideHoverCell);

    return () => {
      window.removeEventListener("pointermove", updateHoverCell);
      window.removeEventListener("blur", hideHoverCell);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(129,140,248,0.06),transparent_42%)]"
      data-testid="workspace-engineering-grid"
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(rgba(199,210,254,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(199,210,254,0.08)_1px,transparent_1px)] [background-size:124px_124px]"
        data-testid="workspace-grid-lines"
      />
      <div
        className="absolute h-[124px] w-[124px] opacity-0 transition-[opacity,transform] duration-300 ease-out"
        data-active={hoverCell.active ? "true" : "false"}
        data-pattern-direction={hoverCell.patternDirection}
        data-testid="workspace-grid-hover-cell"
        style={{
          backgroundImage: `repeating-linear-gradient(${hoverCell.patternDirection === "forward" ? "45deg" : "-45deg"}, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 5px)`,
          opacity: hoverCell.active ? 1 : 0,
          transform: `translate(${hoverCell.x}px, ${hoverCell.y}px)`,
        }}
      />
    </div>
  );
}
