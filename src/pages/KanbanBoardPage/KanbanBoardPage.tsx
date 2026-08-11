import { UserButton } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { AddJobApplicationModal } from "../../components/organisms/AddJobApplicationModal/AddJobApplicationModal";
import type { JobApplicationFormData } from "../../components/molecules/JobApplicationFormFields/jobApplicationFormSchema";
import { JobApplicationDetailModal } from "../../components/organisms/JobApplicationDetailModal/JobApplicationDetailModal";
import { KanbanBoard } from "../../components/organisms/KanbanBoard/KanbanBoard";
import {
  useCreateJobApplication,
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

function findApplicationOpener(applicationId: string) {
  return Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-application-opener]"),
  ).find(
    (candidate) => candidate.dataset.applicationOpener === applicationId,
  );
}

export function KanbanBoardPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplication | null>(null);
  const addApplicationButtonRef = useRef<HTMLButtonElement>(null);
  const pendingAddFocusRestorationRef = useRef(false);
  const selectedApplicationOpenerRef = useRef<HTMLButtonElement | null>(null);
  const pendingFocusRestorationRef = useRef<{
    applicationId: string;
    opener: HTMLButtonElement;
  } | null>(null);
  const applicationsHeadingRef = useRef<HTMLHeadingElement>(null);
  const applicationsQuery = useJobApplications();
  const createApplication = useCreateJobApplication();
  const reorderApplications = useReorderJobApplications();
  const updateApplication = useUpdateJobApplication();
  const deleteApplication = useDeleteJobApplication();
  const isDetailOpen = selectedApplication !== null;

  useEffect(() => {
    if (isAddOpen || !pendingAddFocusRestorationRef.current) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      addApplicationButtonRef.current?.focus();
      pendingAddFocusRestorationRef.current = false;
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isAddOpen]);

  useEffect(() => {
    if (isDetailOpen || !pendingFocusRestorationRef.current) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      const focusRestoration = pendingFocusRestorationRef.current;
      if (!focusRestoration) return;

      if (focusRestoration.opener.isConnected) {
        focusRestoration.opener.focus();
      } else {
        const replacementOpener = findApplicationOpener(
          focusRestoration.applicationId,
        );
        (replacementOpener ?? applicationsHeadingRef.current)?.focus();
      }

      pendingFocusRestorationRef.current = null;
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isDetailOpen]);

  function handleReorder(result: ReorderResult) {
    reorderApplications.mutate(result);
  }

  function handleOpenAddApplication() {
    createApplication.reset();
    pendingAddFocusRestorationRef.current = false;
    setIsAddOpen(true);
  }

  function handleCloseAddApplication() {
    createApplication.reset();
    pendingAddFocusRestorationRef.current = true;
    setIsAddOpen(false);
  }

  async function handleCreateApplication(input: JobApplicationFormData) {
    const destinationOrderIndexes = (applicationsQuery.data ?? [])
      .filter((application) => application.status === input.status)
      .map((application) => application.order_index);

    return createApplication.mutateAsync({
      ...input,
      order_index: Math.max(0, ...destinationOrderIndexes) + 1_000,
    });
  }

  function handleSelectApplication(
    application: JobApplication,
    opener: HTMLButtonElement,
  ) {
    updateApplication.reset();
    deleteApplication.reset();
    pendingFocusRestorationRef.current = null;
    selectedApplicationOpenerRef.current = opener;
    setSelectedApplication(application);
  }

  function handleCloseDetails() {
    updateApplication.reset();
    deleteApplication.reset();
    if (selectedApplication && selectedApplicationOpenerRef.current) {
      pendingFocusRestorationRef.current = {
        applicationId: selectedApplication.id,
        opener: selectedApplicationOpenerRef.current,
      };
    }
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
            <h1
              ref={applicationsHeadingRef}
              className="mt-2 text-3xl font-bold tracking-tight"
              tabIndex={-1}
            >
              Applications
            </h1>
            <p className="mt-2 text-slate-600">
              Track every opportunity from saved to final decision.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              ref={addApplicationButtonRef}
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={createApplication.isPending}
              onClick={handleOpenAddApplication}
            >
              + Add Application
            </button>
            <UserButton />
          </div>
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

        {isAddOpen ? (
          <AddJobApplicationModal
            hasCreateError={createApplication.isError}
            isCreating={createApplication.isPending}
            onClose={handleCloseAddApplication}
            onCreate={handleCreateApplication}
          />
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
