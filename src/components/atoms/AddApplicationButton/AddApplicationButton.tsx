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
        "min-h-11 cursor-pointer rounded-full border-white/45 bg-[#0A0A0A]/80 px-3 text-ink backdrop-blur-sm hover:border-white/80 hover:bg-white/10",
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
        className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[#0A0A0A]"
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
