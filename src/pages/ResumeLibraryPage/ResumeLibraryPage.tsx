import { UserButton } from "@clerk/clerk-react";
import { PanelLeft } from "lucide-react";
import {
  ApplicationNavigation,
  type ApplicationStageCounts,
} from "../../components/organisms/ApplicationNavigation/ApplicationNavigation";
import { AnimatedSidebarTrigger } from "../../components/atoms/AnimatedSidebar/AnimatedSidebar";
import { ResumeLibrary } from "../../components/organisms/ResumeLibrary/ResumeLibrary";
import { WorkspaceEngineeringGrid } from "../../components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid";
import { useJobApplications } from "../../hooks/useJobApplications";
import {
  useDeleteResume,
  useResumes,
  useUploadResume,
} from "../../hooks/useResumes";
import { JOB_APPLICATION_STATUS_ORDER } from "../../lib/jobApplicationStatusPresentation";
import { ApplicationShell } from "../../layouts/ApplicationShell/ApplicationShell";

export function ResumeLibraryPage() {
  const applicationsQuery = useJobApplications();
  const resumesQuery = useResumes();
  const uploadResume = useUploadResume();
  const deleteResume = useDeleteResume();
  const applications = applicationsQuery.data ?? [];
  const stageCounts = JOB_APPLICATION_STATUS_ORDER.reduce<ApplicationStageCounts>(
    (counts, status) => ({
      ...counts,
      [status]: applications.filter((application) => application.status === status).length,
    }),
    { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 },
  );

  return (
    <ApplicationShell
      navigation={
        <ApplicationNavigation
          activeDestination="resumes"
          accountMenu={<UserButton />}
          isAddDisabled={false}
          onAddApplication={() => {}}
          stageCounts={stageCounts}
        />
      }
    >
      <div className="relative min-h-screen overflow-hidden bg-canvas pb-8 pt-16 text-ink md:pt-0">
        <WorkspaceEngineeringGrid />
        <div className="relative z-10">
          <header className="flex h-16 items-center gap-3 border-b border-line/80 bg-canvas/85 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
            <AnimatedSidebarTrigger aria-label="Toggle sidebar" title="Toggle sidebar" className="hidden text-muted transition-colors hover:bg-hover hover:text-ink md:inline-flex">
              <PanelLeft aria-hidden="true" className="size-4" />
            </AnimatedSidebarTrigger>
            <p className="text-sm font-medium text-ink">Resumes</p>
          </header>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[72rem] pt-10 md:pt-14">
              {resumesQuery.isPending ? (
                <p className="text-sm text-muted" role="status">Loading resumes…</p>
              ) : resumesQuery.isError ? (
                <p className="text-sm text-danger" role="alert">Could not load resumes. Please try again.</p>
              ) : (
                <ResumeLibrary
                  hasDeleteError={deleteResume.isError}
                  hasUploadError={uploadResume.isError}
                  isDeleting={deleteResume.isPending}
                  isUploading={uploadResume.isPending}
                  resumes={resumesQuery.data ?? []}
                  onDelete={(resume) => deleteResume.mutateAsync(resume)}
                  onUpload={(input) => uploadResume.mutateAsync(input)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ApplicationShell>
  );
}
