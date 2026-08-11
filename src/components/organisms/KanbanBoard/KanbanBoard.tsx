import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { JobApplicationCard } from "../../molecules/JobApplicationCard/JobApplicationCard";
import type {
  JobApplication,
  JobApplicationStatus,
} from "../../../types/database";

const ORDER_STEP = 1_000;

const KANBAN_COLUMNS: ReadonlyArray<{
  status: JobApplicationStatus;
  label: string;
}> = [
  { status: "saved", label: "Saved" },
  { status: "applied", label: "Applied" },
  { status: "interview", label: "Interview" },
  { status: "offer", label: "Offer" },
  { status: "rejected", label: "Rejected" },
];

type KanbanBoardProps = {
  applications: JobApplication[];
  isUpdating?: boolean;
  onMove: (
    application: JobApplication,
    status: JobApplicationStatus,
    orderIndex: number,
  ) => void | Promise<void>;
};

type KanbanColumnProps = {
  applications: JobApplication[];
  label: string;
  status: JobApplicationStatus;
};

function KanbanColumn({ applications, label, status }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `column:${status}` });

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
            />
          ))
        )}
      </div>
    </section>
  );
}

export function KanbanBoard({
  applications,
  isUpdating = false,
  onMove,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || isUpdating) return;

    const targetId = String(over.id);
    if (!targetId.startsWith("column:")) return;

    const targetStatus = targetId.replace(
      "column:",
      "",
    ) as JobApplicationStatus;
    const application = applications.find(({ id }) => id === active.id);

    if (!application || application.status === targetStatus) return;

    const targetApplications = applications.filter(
      ({ status }) => status === targetStatus,
    );
    const lastOrderIndex = targetApplications.reduce(
      (highest, item) => Math.max(highest, item.order_index),
      0,
    );

    void onMove(application, targetStatus, lastOrderIndex + ORDER_STEP);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid min-w-max grid-cols-5 gap-4">
        {KANBAN_COLUMNS.map(({ label, status }) => {
          const columnApplications = applications
            .filter((application) => application.status === status)
            .sort((left, right) => left.order_index - right.order_index);

          return (
            <div key={status} className="w-72">
              <KanbanColumn
                applications={columnApplications}
                label={label}
                status={status}
              />
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}
