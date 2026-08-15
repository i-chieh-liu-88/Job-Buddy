import { UserButton } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { PanelLeft } from "lucide-react";
import { useState } from "react";
import { AnimatedSidebarTrigger } from "../../components/atoms/AnimatedSidebar/AnimatedSidebar";
import { TextReveal } from "../../components/atoms/TextReveal/TextReveal";
import { WorkspaceEngineeringGrid } from "../../components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid";
import {
  ApplicationNavigation,
  type ApplicationStageCounts,
} from "../../components/organisms/ApplicationNavigation/ApplicationNavigation";
import { MonthInterviewCalendar } from "../../components/organisms/MonthInterviewCalendar/MonthInterviewCalendar";
import { useInterviewsForMonth } from "../../hooks/useInterviews";
import { useJobApplications } from "../../hooks/useJobApplications";
import { JOB_APPLICATION_STATUS_ORDER } from "../../lib/jobApplicationStatusPresentation";
import { ApplicationShell } from "../../layouts/ApplicationShell/ApplicationShell";

export function InterviewCalendarPage() {
  const [month, setMonth] = useState(() => new Date());
  const navigate = useNavigate();
  const applicationsQuery = useJobApplications();
  const interviewsQuery = useInterviewsForMonth(month);
  const applications = applicationsQuery.data ?? [];
  const interviews = interviewsQuery.data ?? [];
  const stageCounts = JOB_APPLICATION_STATUS_ORDER.reduce<ApplicationStageCounts>(
    (counts, status) => ({
      ...counts,
      [status]: applications.filter((application) => application.status === status).length,
    }),
    { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 },
  );
  const applicationLabels = new Map(
    applications.map(({ id, company, position }) => [id, { company, position }]),
  );

  return (
    <ApplicationShell
      navigation={
        <ApplicationNavigation
          activeDestination="calendar"
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
            <p className="text-sm font-medium text-ink">Calendar</p>
          </header>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[96rem] pt-10 md:pt-14">
              <header className="mb-8">
                <TextReveal as="h1" className="font-display text-4xl font-medium tracking-[-0.045em] text-ink sm:text-5xl md:text-6xl" delay={0.15} text="Interview calendar" />
                <TextReveal as="p" className="mt-3 max-w-2xl text-sm leading-6 text-muted" delay={0.52} stagger={0.025} text="Keep every interview round visible, organized, and on time." />
              </header>

              {interviewsQuery.isPending ? <p role="status" className="text-sm text-muted">Loading interviews…</p> : null}
              {interviewsQuery.isError ? <p role="alert" className="text-sm text-danger">Could not load interviews. Please try again.</p> : null}
              {!interviewsQuery.isPending && !interviewsQuery.isError && interviews.length === 0 ? <p className="text-sm text-muted">No interviews scheduled this month.</p> : null}
              {!interviewsQuery.isPending && !interviewsQuery.isError ? (
                <MonthInterviewCalendar
                  applicationLabels={applicationLabels}
                  interviews={interviews}
                  month={month}
                  onMonthChange={setMonth}
                  onOpenApplication={(applicationId) => {
                    void navigate({ to: "/", search: { applicationId } });
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </ApplicationShell>
  );
}
