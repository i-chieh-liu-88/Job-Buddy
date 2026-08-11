import type {
  JobApplication,
  JobApplicationStatus,
} from "../../../types/database";

export type ReorderUpdate = {
  id: string;
  status: JobApplicationStatus;
  order_index: number;
};

export type ReorderResult = {
  applications: JobApplication[];
  updates: ReorderUpdate[];
};

const STATUSES: JobApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];

function isStatus(value: string): value is JobApplicationStatus {
  return STATUSES.includes(value as JobApplicationStatus);
}

function getColumn(
  applications: JobApplication[],
  status: JobApplicationStatus,
) {
  return applications
    .filter((application) => application.status === status)
    .sort((left, right) => left.order_index - right.order_index);
}

function normalizeColumn(
  applications: JobApplication[],
  status: JobApplicationStatus,
) {
  return applications.map((application, index) => ({
    ...application,
    status,
    order_index: (index + 1) * 1_000,
  }));
}

export function reorderApplications(
  applications: JobApplication[],
  activeId: string,
  overId: string,
): ReorderResult | null {
  const activeApplication = applications.find(({ id }) => id === activeId);
  const overApplication = applications.find(({ id }) => id === overId);

  if (!activeApplication || activeId === overId) return null;

  const columnTarget = overId.startsWith("column:")
    ? overId.replace("column:", "")
    : null;
  const targetStatus = overApplication?.status ?? columnTarget;

  if (!targetStatus || !isStatus(targetStatus)) return null;

  const sourceStatus = activeApplication.status;
  const sourceColumn = getColumn(applications, sourceStatus);
  const activeIndex = sourceColumn.findIndex(({ id }) => id === activeId);
  const originalById = new Map(
    applications.map((application) => [application.id, application]),
  );
  let affectedApplications: JobApplication[];
  let applicationsResult: JobApplication[];

  if (sourceStatus === targetStatus) {
    const overIndex = overApplication
      ? sourceColumn.findIndex(({ id }) => id === overId)
      : sourceColumn.length - 1;
    const reorderedColumn = [...sourceColumn];
    const [movedApplication] = reorderedColumn.splice(activeIndex, 1);

    reorderedColumn.splice(overIndex, 0, movedApplication);
    affectedApplications = normalizeColumn(reorderedColumn, sourceStatus);
    applicationsResult = [
      ...applications.filter(({ status }) => status !== sourceStatus),
      ...affectedApplications,
    ];
  } else {
    const sourceWithoutActive = sourceColumn.filter(({ id }) => id !== activeId);
    const targetColumn = getColumn(applications, targetStatus);
    const targetIndex = overApplication
      ? targetColumn.findIndex(({ id }) => id === overId)
      : targetColumn.length;
    const destinationWithActive = [...targetColumn];

    destinationWithActive.splice(targetIndex, 0, activeApplication);

    const normalizedSource = normalizeColumn(sourceWithoutActive, sourceStatus);
    const normalizedTarget = normalizeColumn(
      destinationWithActive,
      targetStatus,
    );
    affectedApplications = [...normalizedSource, ...normalizedTarget];
    applicationsResult = [
      ...applications.filter(
        ({ status }) => status !== sourceStatus && status !== targetStatus,
      ),
      ...affectedApplications,
    ];
  }

  const updates = affectedApplications.flatMap((application) => {
    const original = originalById.get(application.id);

    return original?.status !== application.status ||
      original.order_index !== application.order_index
      ? [
          {
            id: application.id,
            status: application.status,
            order_index: application.order_index,
          },
        ]
      : [];
  });

  if (updates.length === 0) return null;

  return {
    applications: applicationsResult,
    updates,
  };
}
