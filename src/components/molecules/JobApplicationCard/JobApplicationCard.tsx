import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import { JOB_APPLICATION_STATUS_PRESENTATION } from "../../../lib/jobApplicationStatusPresentation";
import type { JobApplication } from "../../../types/database";

export type SelectJobApplication = (
  application: JobApplication,
  opener: HTMLButtonElement,
) => void;

type JobApplicationCardProps = {
  application: JobApplication;
  isDisabled?: boolean;
  onSelect: SelectJobApplication;
};

const appliedDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

function formatAppliedDate(value: string) {
  return appliedDateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function JobApplicationCardContent({
  application,
}: Pick<JobApplicationCardProps, "application">) {
  const presentation =
    JOB_APPLICATION_STATUS_PRESENTATION[application.status];
  const hasMetadata = Boolean(application.applied_date || application.job_url);

  return (
    <span className="block min-w-0">
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[0.9375rem] font-semibold leading-5 text-ink">
            {application.position}
          </span>
          <span className="mt-1 block truncate text-xs font-medium text-muted">
            {application.company}
          </span>
        </span>
        <span
          className={`mt-1 size-2.5 shrink-0 rounded-full ${presentation.indicatorClassName}`}
          aria-label={`Status: ${presentation.label}`}
        />
      </span>

      {hasMetadata ? (
        <span className="mt-3 flex min-h-4 items-center gap-2 text-[0.6875rem] leading-4 text-muted">
          {application.applied_date ? (
            <span>{`Applied ${formatAppliedDate(application.applied_date)}`}</span>
          ) : null}
          {application.job_url ? (
            <span
              className="inline-flex items-center"
              aria-label="Job URL available"
            >
              <svg
                aria-hidden="true"
                className="size-3.5"
                fill="none"
                viewBox="0 0 16 16"
              >
                <path
                  d="M6.25 3.25H3.5A1.25 1.25 0 0 0 2.25 4.5v8A1.25 1.25 0 0 0 3.5 13.75h8a1.25 1.25 0 0 0 1.25-1.25V9.75M8.75 2.25h5v5M7 9l6.5-6.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.25"
                />
              </svg>
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

export function JobApplicationCardPreview({
  application,
}: Pick<JobApplicationCardProps, "application">) {
  return (
    <article
      className="rotate-1 rounded-xl border border-line bg-canvas p-4 shadow-lg"
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
      className={`group flex items-stretch overflow-hidden rounded-xl border border-line bg-canvas shadow-[0_1px_2px_rgba(30,31,33,0.06)] transition-[border-color,box-shadow,opacity] hover:border-muted/40 hover:shadow-[0_2px_8px_rgba(30,31,33,0.08)] motion-reduce:transition-none ${
        isDragging ? "relative z-10 opacity-30" : ""
      }`}
      aria-label={`${application.position} at ${application.company}`}
    >
      <button
        type="button"
        className="min-w-0 flex-1 p-4 text-left transition-colors hover:bg-hover/35 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus disabled:cursor-not-allowed motion-reduce:transition-none"
        aria-label={`Open ${application.position} at ${application.company}`}
        data-application-opener={application.id}
        disabled={isDisabled}
        onClick={(event) => onSelect(application, event.currentTarget)}
      >
        <JobApplicationCardContent application={application} />
      </button>
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="min-w-11 touch-none self-stretch border-l border-line px-3 text-muted transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
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
