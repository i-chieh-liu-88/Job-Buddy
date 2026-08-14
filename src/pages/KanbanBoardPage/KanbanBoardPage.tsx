import { UserButton } from "@clerk/clerk-react";
import { useSearch } from "@tanstack/react-router";
import { PanelLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AddJobApplicationModal } from "../../components/organisms/AddJobApplicationModal/AddJobApplicationModal";
import type { JobApplicationFormData } from "../../components/molecules/JobApplicationFormFields/jobApplicationFormSchema";
import {
  ApplicationNavigation,
  type ApplicationStageCounts,
} from "../../components/organisms/ApplicationNavigation/ApplicationNavigation";
import { AnimatedSidebarTrigger } from "../../components/atoms/AnimatedSidebar/AnimatedSidebar";
import { TextReveal } from "../../components/atoms/TextReveal/TextReveal";
import { WorkspaceEngineeringGrid } from "../../components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid";
import { JobApplicationDetailDrawer } from "../../components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer";
import { KanbanBoard } from "../../components/organisms/KanbanBoard/KanbanBoard";
import {
  useCreateJobApplication,
  useDeleteJobApplication,
  useJobApplications,
  useReorderJobApplications,
  useUpdateJobApplication,
} from "../../hooks/useJobApplications";
import { useResumes } from "../../hooks/useResumes";
import type { UpdateJobApplicationInput } from "../../hooks/useJobApplications";
import type { ReorderResult } from "../../components/organisms/KanbanBoard/reorderApplications";
import { JOB_APPLICATION_STATUS_ORDER } from "../../lib/jobApplicationStatusPresentation";
import { ApplicationShell } from "../../layouts/ApplicationShell/ApplicationShell";
import type { JobApplication } from "../../types/database";

/* eslint-disable react-hooks/set-state-in-effect */

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
  const processedDeepLinkIdRef = useRef<string | null>(null);
  const addApplicationOpenerRef = useRef<HTMLButtonElement | null>(null);
  const pendingAddFocusRestorationRef = useRef(false);
  const selectedApplicationOpenerRef = useRef<HTMLButtonElement | null>(null);
  const pendingFocusRestorationRef = useRef<{
    applicationId: string;
    opener: HTMLButtonElement;
  } | null>(null);
  const applicationsHeadingRef = useRef<HTMLHeadingElement>(null);
  const applicationsQuery = useJobApplications();
  const { applicationId } = useSearch({ from: "/" });
  const resumesQuery = useResumes();
  const createApplication = useCreateJobApplication();
  const reorderApplications = useReorderJobApplications();
  const updateApplication = useUpdateJobApplication();
  const deleteApplication = useDeleteJobApplication();
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
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
    if (
      applicationsQuery.isPending ||
      !applicationId ||
      processedDeepLinkIdRef.current === applicationId
    ) {
      return;
    }

    processedDeepLinkIdRef.current = applicationId;
    const application = applications.find((candidate) => candidate.id === applicationId);
    if (!application) return;

    updateApplication.reset();
    deleteApplication.reset();
    pendingFocusRestorationRef.current = null;
    selectedApplicationOpenerRef.current = null;
    // The deep-link effect must commit synchronously. Strict Mode cleans up an
    // animation frame from its first effect pass before the frame can run.
    setSelectedApplication(application);
    setIsDetailOpen(true);
  }, [applicationId, applications, applicationsQuery.isPending, deleteApplication, updateApplication]);

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
      <div className="relative min-h-screen overflow-hidden bg-canvas pb-8 pt-16 text-ink md:pt-0">
        <WorkspaceEngineeringGrid />
        <div className="relative z-10">
        <header className="flex h-16 items-center gap-3 border-b border-line/80 bg-canvas/85 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <AnimatedSidebarTrigger
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
            className="hidden text-muted transition-colors hover:bg-hover hover:text-ink md:inline-flex"
          >
            <PanelLeft aria-hidden="true" className="size-4" />
          </AnimatedSidebarTrigger>
          <p className="text-sm font-medium text-ink">Applications</p>
        </header>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[96rem]">
            <header className="mb-8 pt-10 md:pt-14">
              <TextReveal
                as="p"
                className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted"
                delay={0.05}
                stagger={0.05}
                text="Your job search workspace"
              />
              <h1
                ref={applicationsHeadingRef}
                className="mt-3 font-display text-4xl font-medium tracking-[-0.045em] text-ink sm:text-5xl md:text-6xl"
                tabIndex={-1}
              >
                <TextReveal
                delay={0.15}
                split="char"
                stagger={0.035}
                text="Applications"
                />
              </h1>
              <TextReveal
                as="h2"
                className="mt-7 text-xl font-semibold tracking-[-0.02em] text-ink"
                delay={0.36}
                stagger={0.07}
                text="Keep moving forward."
              />
              <TextReveal
                as="p"
                className="mt-2 max-w-2xl text-sm leading-6 text-muted"
                delay={0.52}
                stagger={0.025}
                text="Keep every opportunity organized, from the first saved role to the final decision."
              />
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
            <div className="w-full pb-4">
              <KanbanBoard
                applications={applications}
                isAddDisabled={createApplication.isPending}
                isUpdating={reorderApplications.isPending}
                onAddApplication={handleOpenAddApplication}
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
              hasResumesError={resumesQuery.isError}
              isDeleting={deleteApplication.isPending}
              isSaving={updateApplication.isPending}
              isResumesLoading={resumesQuery.isPending}
              onDelete={(id) => deleteApplication.mutateAsync(id)}
              onExitComplete={handleDetailExitComplete}
              onOpenChange={(open) => {
                if (!open) handleRequestCloseDetails();
              }}
              onSave={handleSaveApplication}
              open={isDetailOpen}
              resumes={resumesQuery.data ?? []}
            />
          ) : null}
          </div>
        </div>
        </div>
      </div>
    </ApplicationShell>
  );
}
