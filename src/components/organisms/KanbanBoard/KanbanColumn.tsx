import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { JobApplication, JobApplicationStatus } from "../../../types/database";
import { JOB_APPLICATION_STATUS_PRESENTATION } from "../../../lib/jobApplicationStatusPresentation";
import {
  JobApplicationCard,
  type SelectJobApplication,
} from "../../molecules/JobApplicationCard/JobApplicationCard";

type KanbanColumnProps = {
  applications: JobApplication[];
  isAddDisabled?: boolean;
  isDisabled: boolean;
  label: string;
  onAddApplication?: (opener: HTMLButtonElement) => void;
  onSelectApplication: SelectJobApplication;
  status: JobApplicationStatus;
};

export function KanbanColumn({
  applications,
  isAddDisabled = false,
  isDisabled,
  label,
  onAddApplication,
  onSelectApplication,
  status,
}: KanbanColumnProps) {
  const presentation = JOB_APPLICATION_STATUS_PRESENTATION[status];
  const { isOver, setNodeRef } = useDroppable({
    id: `column:${status}`,
    disabled: isDisabled,
  });

  return (
    <section
      ref={setNodeRef}
      className={`min-h-40 rounded-2xl border p-3 shadow-[0_12px_30px_rgba(17,24,39,0.07)] transition-colors motion-reduce:transition-none md:min-h-[22rem] ${
        isOver
          ? "border-focus bg-primary/10"
          : "border-line/90 bg-surface"
      }`}
      aria-labelledby={`column-title-${status}`}
    >
      <header className="mb-3 border-b border-ink/10 px-1 pb-3 pt-1">
        <h2
          id={`column-title-${status}`}
          className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-ink"
        >
          <span
            className="relative flex size-2.5 shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <span
              className={`absolute size-3 animate-ping rounded-full opacity-45 motion-reduce:animate-none ${presentation.indicatorClassName}`}
              data-testid={`status-ping-${status}`}
            />
            <span
              className={`relative size-2.5 rounded-full ${presentation.indicatorClassName}`}
            />
          </span>
          {`${label} (${applications.length})`}
        </h2>
      </header>

      <SortableContext
        items={applications.map(({ id }) => id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {applications.length === 0 && status === "saved" && onAddApplication ? (
            <button
              type="button"
              className="group grid min-h-24 w-full cursor-pointer place-items-center rounded-lg border border-dashed border-primary/45 bg-primary/[0.03] p-4 text-center text-sm normal-case! text-muted transition-[background-color,border-color,color] hover:border-primary/80 hover:bg-primary/[0.08] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              disabled={isAddDisabled}
              onClick={(event) => onAddApplication(event.currentTarget)}
            >
              <span className="flex flex-col items-center gap-2">
                <Plus
                  aria-hidden="true"
                  className="size-5 text-primary transition-transform group-hover:scale-110 motion-reduce:transition-none"
                  strokeWidth={1.25}
                />
                <span className="font-sans! text-sm! font-normal!">
                  Add application
                </span>
              </span>
            </button>
          ) : applications.length === 0 ? (
            <p className="grid min-h-24 place-items-center rounded-lg border border-dashed border-line bg-canvas/45 p-4 text-center text-sm text-muted">
              No applications yet
            </p>
          ) : (
            applications.map((application) => (
              <JobApplicationCard
                key={application.id}
                application={application}
                isDisabled={isDisabled}
                onSelect={onSelectApplication}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}
