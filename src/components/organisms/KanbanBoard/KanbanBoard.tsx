import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { JobApplicationCardPreview } from "../../molecules/JobApplicationCard/JobApplicationCard";
import type {
  JobApplication,
  JobApplicationStatus,
} from "../../../types/database";
import { KanbanColumn } from "./KanbanColumn";
import {
  reorderApplications,
  type ReorderResult,
} from "./reorderApplications";

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

const noopSelectApplication = () => {};

type KanbanBoardProps = {
  applications: JobApplication[];
  isUpdating?: boolean;
  onReorder: (result: ReorderResult) => void;
  onSelectApplication?: (application: JobApplication) => void;
};

export function KanbanBoard({
  applications,
  isUpdating = false,
  onReorder,
  onSelectApplication = noopSelectApplication,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || isUpdating) return;

    const result = reorderApplications(
      applications,
      String(active.id),
      String(over.id),
    );

    if (result) onReorder(result);
  }

  const activeApplication = applications.find(({ id }) => id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="grid min-w-max grid-cols-5 gap-4">
        {KANBAN_COLUMNS.map(({ label, status }) => {
          const columnApplications = applications
            .filter((application) => application.status === status)
            .sort((left, right) => left.order_index - right.order_index);

          return (
            <div key={status} className="w-72">
              <KanbanColumn
                applications={columnApplications}
                isDisabled={isUpdating}
                label={label}
                onSelectApplication={onSelectApplication}
                status={status}
              />
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeApplication ? (
          <div className="w-72">
            <JobApplicationCardPreview application={activeApplication} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
