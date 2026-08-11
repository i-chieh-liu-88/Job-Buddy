import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import type { JobApplication } from "../../../types/database";

type JobApplicationCardProps = {
  application: JobApplication;
  isDisabled?: boolean;
};

function JobApplicationCardContent({
  application,
}: Pick<JobApplicationCardProps, "application">) {
  return (
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
  );
}

export function JobApplicationCardPreview({
  application,
}: Pick<JobApplicationCardProps, "application">) {
  return (
    <article
      className="rotate-1 rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
      aria-label={`${application.position} at ${application.company}`}
    >
      <JobApplicationCardContent application={application} />
    </article>
  );
}

export function JobApplicationCard({
  application,
  isDisabled = false,
}: JobApplicationCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: application.id,
    disabled: isDisabled,
  });

  const dragStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={dragStyle}
      className={`touch-none rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${
        isDragging ? "relative z-10 opacity-30" : ""
      } cursor-grab`}
      aria-label={`${application.position} at ${application.company}`}
      {...listeners}
      {...attributes}
    >
      <JobApplicationCardContent application={application} />
    </article>
  );
}
