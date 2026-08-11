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
import {
  JobApplicationCardPreview,
  type SelectJobApplication,
} from "../../molecules/JobApplicationCard/JobApplicationCard";
import type {
  JobApplication,
} from "../../../types/database";
import {
  JOB_APPLICATION_STATUS_ORDER,
  JOB_APPLICATION_STATUS_PRESENTATION,
} from "../../../lib/jobApplicationStatusPresentation";
import { KanbanColumn } from "./KanbanColumn";
import {
  reorderApplications,
  type ReorderResult,
} from "./reorderApplications";

const noopSelectApplication: SelectJobApplication = () => {};

type KanbanBoardProps = {
  applications: JobApplication[];
  isUpdating?: boolean;
  onReorder: (result: ReorderResult) => void;
  onSelectApplication?: SelectJobApplication;
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
      <div className="flex w-full flex-col gap-4 md:min-w-max md:flex-row">
        {JOB_APPLICATION_STATUS_ORDER.map((status) => {
          const { label } = JOB_APPLICATION_STATUS_PRESENTATION[status];
          const columnApplications = applications
            .filter((application) => application.status === status)
            .sort((left, right) => left.order_index - right.order_index);

          return (
            <div key={status} className="w-full md:w-[19rem] md:shrink-0">
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
          <div className="w-[min(19rem,calc(100vw-2rem))]">
            <JobApplicationCardPreview application={activeApplication} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
