import { UserButton } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { AddJobApplicationModal } from "../../components/organisms/AddJobApplicationModal/AddJobApplicationModal";
import type { JobApplicationFormData } from "../../components/molecules/JobApplicationFormFields/jobApplicationFormSchema";
import {
  ApplicationNavigation,
  type ApplicationStageCounts,
} from "../../components/organisms/ApplicationNavigation/ApplicationNavigation";
import { JobApplicationDetailDrawer } from "../../components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer";
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
import { JOB_APPLICATION_STATUS_ORDER } from "../../lib/jobApplicationStatusPresentation";
import { ApplicationShell } from "../../layouts/ApplicationShell/ApplicationShell";
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplication | null>(null);
  const addApplicationOpenerRef = useRef<HTMLButtonElement | null>(null);
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
  const applications = applicationsQuery.data ?? [];
  const stageCounts = JOB_APPLICATION_STATUS_ORDER.reduce<ApplicationStageCounts>(
    (counts, status) => ({
      ...counts,
      [status]: applications.filter(
        (application) => application.status === status,
      ).length,
    }),
    { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 },
  );

  useEffect(() => {
    if (isAddOpen || !pendingAddFocusRestorationRef.current) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      addApplicationOpenerRef.current?.focus();
      pendingAddFocusRestorationRef.current = false;
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isAddOpen]);

  useEffect(() => {
    if (selectedApplication || !pendingFocusRestorationRef.current) return;

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
  }, [selectedApplication]);

  function handleReorder(result: ReorderResult) {
    reorderApplications.mutate(result);
  }

  function handleOpenAddApplication(opener: HTMLButtonElement) {
    createApplication.reset();
    pendingAddFocusRestorationRef.current = false;
    addApplicationOpenerRef.current = opener;
    setIsAddOpen(true);
  }

  function handleCloseAddApplication() {
    createApplication.reset();
    pendingAddFocusRestorationRef.current = true;
    setIsAddOpen(false);
  }

  async function handleCreateApplication(input: JobApplicationFormData) {
    const destinationOrderIndexes = applications
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
    setIsDetailOpen(true);
  }

  function handleRequestCloseDetails() {
    updateApplication.reset();
    deleteApplication.reset();
    if (selectedApplication && selectedApplicationOpenerRef.current) {
      pendingFocusRestorationRef.current = {
        applicationId: selectedApplication.id,
        opener: selectedApplicationOpenerRef.current,
      };
    }
    setIsDetailOpen(false);
  }

  function handleDetailExitComplete() {
    setSelectedApplication(null);
  }

  async function handleSaveApplication(input: UpdateJobApplicationInput) {
    if (input.status === selectedApplication?.status) {
      return updateApplication.mutateAsync(input);
    }

    const destinationOrderIndexes = applications
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
    <ApplicationShell
      navigation={
        <ApplicationNavigation
          accountMenu={<UserButton />}
          isAddDisabled={createApplication.isPending}
          onAddApplication={handleOpenAddApplication}
          stageCounts={stageCounts}
        />
      }
    >
      <div className="min-h-screen bg-canvas px-4 pb-6 pt-24 text-ink sm:px-6 md:py-8 lg:px-8">
        <div className="mx-auto max-w-[96rem]">
          <header className="mb-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-focus">
              Job Buddy
            </p>
            <h1
              ref={applicationsHeadingRef}
              className="mt-2 text-3xl font-bold tracking-tight"
              tabIndex={-1}
            >
              Applications
            </h1>
            <p className="mt-2 text-muted">
              Track every opportunity from saved to final decision.
            </p>
          </div>
          </header>

          {applicationsQuery.isPending ? (
            <p role="status" className="text-muted">
              Loading applications…
            </p>
          ) : applicationsQuery.isError ? (
            <div role="alert" className="text-danger">
              <p>Could not load applications. Please try again.</p>
              {import.meta.env.DEV ? (
                <code className="mt-2 block whitespace-pre-wrap text-xs text-muted">
                  {formatQueryError(applicationsQuery.error)}
                </code>
              ) : null}
            </div>
          ) : (
            <div className="w-full overflow-x-visible pb-4 md:overflow-x-auto">
              <KanbanBoard
                applications={applications}
                isUpdating={reorderApplications.isPending}
                onReorder={handleReorder}
                onSelectApplication={handleSelectApplication}
              />
            </div>
          )}

          {reorderApplications.isError ? (
            <p role="alert" className="mt-4 text-sm text-danger">
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
            <JobApplicationDetailDrawer
              key={selectedApplication.id}
              application={selectedApplication}
              hasDeleteError={deleteApplication.isError}
              hasSaveError={updateApplication.isError}
              isDeleting={deleteApplication.isPending}
              isSaving={updateApplication.isPending}
              onDelete={(id) => deleteApplication.mutateAsync(id)}
              onExitComplete={handleDetailExitComplete}
              onOpenChange={(open) => {
                if (!open) handleRequestCloseDetails();
              }}
              onSave={handleSaveApplication}
              open={isDetailOpen}
            />
          ) : null}
        </div>
      </div>
    </ApplicationShell>
  );
}
