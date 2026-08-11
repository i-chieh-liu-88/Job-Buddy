import { useDraggable } from "@dnd-kit/core";
import type { CSSProperties } from "react";
import type { JobApplication } from "../../../types/database";

type JobApplicationCardProps = {
  application: JobApplication;
};

export function JobApplicationCard({
  application,
}: JobApplicationCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useDraggable({ id: application.id });

  const dragStyle: CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={dragStyle}
      className={`touch-none rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${
        isDragging ? "relative z-10 opacity-70 shadow-lg" : ""
      }`}
      aria-label={`${application.position} at ${application.company}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">
            {application.position}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-600">
            {application.company}
          </p>
        </div>
        <span
          className="mt-1 size-2.5 shrink-0 rounded-full bg-slate-400"
          aria-label={`Status: ${application.status}`}
        />
      </div>
    </article>
  );
}
