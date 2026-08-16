import { Plus } from "lucide-react";
import type { MouseEventHandler } from "react";
import { cn } from "../../../lib/cn";
import { MagneticAddApplicationButton } from "../MagneticAddApplicationButton/MagneticAddApplicationButton";

type AddApplicationButtonProps = {
  collapsed?: boolean;
  disabled?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function AddApplicationButton({
  collapsed = false,
  disabled = false,
  onClick,
}: AddApplicationButtonProps) {
  return (
    <MagneticAddApplicationButton
      aria-label="Add application"
      className={cn(
        "min-h-11 cursor-pointer rounded-full border-line bg-surface px-3 text-ink shadow-sm backdrop-blur-sm transition-colors hover:border-ink/45 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus focus-visible:ring-2 focus-visible:ring-focus/40",
        collapsed ? "size-11 p-0" : "gap-2.5",
      )}
      disabled={disabled}
      onClick={onClick}
      title="Add application"
      type="button"
      variant="outline"
    >
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-white shadow-sm"
        data-testid="add-application-plus"
      >
        <Plus className="size-4.5 stroke-[2.5]" />
      </span>
      {!collapsed ? (
        <span className="font-mono text-[11px] font-semibold uppercase tracking-tight">
          Add application
        </span>
      ) : null}
    </MagneticAddApplicationButton>
  );
}
