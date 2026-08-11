import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import type { JobApplication } from "../../../types/database";

type JobApplicationCardProps = {
  application: JobApplication;
  isDisabled?: boolean;
  onSelect: (application: JobApplication) => void;
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
  onSelect,
}: JobApplicationCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
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
      className={`flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ${
        isDragging ? "relative z-10 opacity-30" : ""
      }`}
      aria-label={`${application.position} at ${application.company}`}
    >
      <button
        type="button"
        className="min-w-0 flex-1 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 disabled:cursor-not-allowed"
        aria-label={`Open ${application.position} at ${application.company}`}
        disabled={isDisabled}
        onClick={() => onSelect(application)}
      >
        <JobApplicationCardContent application={application} />
      </button>
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="touch-none self-stretch border-l border-slate-200 px-3 text-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Drag ${application.position} at ${application.company}`}
        disabled={isDisabled}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">↕</span>
      </button>
    </article>
  );
}
