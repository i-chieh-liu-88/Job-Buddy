import { UserButton } from "@clerk/clerk-react";
import { useState } from "react";
import { JobApplicationDetailModal } from "../../components/organisms/JobApplicationDetailModal/JobApplicationDetailModal";
import { KanbanBoard } from "../../components/organisms/KanbanBoard/KanbanBoard";
import {
  useDeleteJobApplication,
  useJobApplications,
  useReorderJobApplications,
  useUpdateJobApplication,
} from "../../hooks/useJobApplications";
import type { UpdateJobApplicationInput } from "../../hooks/useJobApplications";
import type { ReorderResult } from "../../components/organisms/KanbanBoard/reorderApplications";
import type { JobApplication } from "../../types/database";

const QUERY_ERROR_FIELDS = ["name", "code", "message"] as const;

function formatQueryError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "Unknown query error";
  }

  const errorRecord = error as Record<string, unknown>;
  const details = QUERY_ERROR_FIELDS.flatMap((field) => {
    const value = errorRecord[field];
    return typeof value === "string" && value.length > 0 ? [value] : [];
  });

  return details.length > 0 ? details.join(" · ") : "Unknown query error";
}

export function KanbanBoardPage() {
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplication | null>(null);
  const applicationsQuery = useJobApplications();
  const reorderApplications = useReorderJobApplications();
  const updateApplication = useUpdateJobApplication();
  const deleteApplication = useDeleteJobApplication();

  function handleReorder(result: ReorderResult) {
    reorderApplications.mutate(result);
  }

  function handleSelectApplication(application: JobApplication) {
    updateApplication.reset();
    deleteApplication.reset();
    setSelectedApplication(application);
  }

  function handleCloseDetails() {
    updateApplication.reset();
    deleteApplication.reset();
    setSelectedApplication(null);
  }

  async function handleSaveApplication(input: UpdateJobApplicationInput) {
    if (input.status === selectedApplication?.status) {
      return updateApplication.mutateAsync(input);
    }

    const destinationOrderIndexes = (applicationsQuery.data ?? [])
      .filter(
        (application) =>
          application.id !== input.id && application.status === input.status,
      )
      .map((application) => application.order_index);

    return updateApplication.mutateAsync({
      ...input,
      order_index: Math.max(0, ...destinationOrderIndexes) + 1_000,
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[96rem]">
        <header className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-blue-600">
              Job Buddy
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Applications
            </h1>
            <p className="mt-2 text-slate-600">
              Track every opportunity from saved to final decision.
            </p>
          </div>
          <UserButton />
        </header>

        {applicationsQuery.isPending ? (
          <p role="status" className="text-slate-600">
            Loading applications…
          </p>
        ) : applicationsQuery.isError ? (
          <div role="alert" className="text-red-700">
            <p>Could not load applications. Please try again.</p>
            {import.meta.env.DEV ? (
              <code className="mt-2 block whitespace-pre-wrap text-xs text-slate-600">
                {formatQueryError(applicationsQuery.error)}
              </code>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <KanbanBoard
              applications={applicationsQuery.data ?? []}
              isUpdating={reorderApplications.isPending}
              onReorder={handleReorder}
              onSelectApplication={handleSelectApplication}
            />
          </div>
        )}

        {reorderApplications.isError ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            The card could not be moved. Please try again.
          </p>
        ) : null}

        {selectedApplication ? (
          <JobApplicationDetailModal
            key={selectedApplication.id}
            application={selectedApplication}
            hasDeleteError={deleteApplication.isError}
            hasSaveError={updateApplication.isError}
            isDeleting={deleteApplication.isPending}
            isSaving={updateApplication.isPending}
            onClose={handleCloseDetails}
            onDelete={(id) => deleteApplication.mutateAsync(id)}
            onSave={handleSaveApplication}
          />
        ) : null}
      </div>
    </main>
  );
}
