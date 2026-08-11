import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { JobApplication, JobApplicationStatus } from "../../../types/database";
import { JOB_APPLICATION_STATUS_PRESENTATION } from "../../../lib/jobApplicationStatusPresentation";
import {
  JobApplicationCard,
  type SelectJobApplication,
} from "../../molecules/JobApplicationCard/JobApplicationCard";

type KanbanColumnProps = {
  applications: JobApplication[];
  isDisabled: boolean;
  label: string;
  onSelectApplication: SelectJobApplication;
  status: JobApplicationStatus;
};

export function KanbanColumn({
  applications,
  isDisabled,
  label,
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
      className={`min-h-40 rounded-xl border p-3 transition-colors motion-reduce:transition-none md:min-h-[22rem] ${
        isOver
          ? "border-focus bg-focus/5"
          : "border-line bg-surface"
      }`}
      aria-labelledby={`column-title-${status}`}
    >
      <header className="mb-3 px-1 py-1">
        <h2
          id={`column-title-${status}`}
          className="flex items-center gap-2 text-sm font-semibold text-ink"
        >
          <span
            className={`size-2.5 shrink-0 rounded-full ${presentation.indicatorClassName}`}
            aria-hidden="true"
          />
          {`${label} (${applications.length})`}
        </h2>
      </header>

      <SortableContext
        items={applications.map(({ id }) => id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {applications.length === 0 ? (
            <p className="grid min-h-24 place-items-center rounded-lg border border-dashed border-line bg-canvas/70 p-4 text-center text-sm text-muted">
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
