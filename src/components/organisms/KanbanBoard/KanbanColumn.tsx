import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { JobApplication, JobApplicationStatus } from "../../../types/database";
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
  const { isOver, setNodeRef } = useDroppable({
    id: `column:${status}`,
    disabled: isDisabled,
  });

  return (
    <section
      ref={setNodeRef}
      className={`min-h-72 rounded-xl border p-3 transition-colors ${
        isOver
          ? "border-blue-400 bg-blue-50"
          : "border-slate-200 bg-slate-100"
      }`}
      aria-labelledby={`column-title-${status}`}
    >
      <header className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2
          id={`column-title-${status}`}
          className="font-semibold text-slate-800"
        >
          {label}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
          {applications.length}
        </span>
      </header>

      <SortableContext
        items={applications.map(({ id }) => id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {applications.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              Drop a card here
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
