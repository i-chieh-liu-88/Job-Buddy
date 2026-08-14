import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InterviewCalendarPage } from "./InterviewCalendarPage";

const { applicationsQuery, interviewsQuery, navigate } = vi.hoisted(() => ({
  applicationsQuery: {
    data: [] as unknown[],
    isError: false,
    isPending: false,
  },
  interviewsQuery: {
    data: [] as unknown[],
    isError: false,
    isPending: false,
  },
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@clerk/clerk-react", () => ({ UserButton: () => <div>User</div> }));
vi.mock("../../hooks/useJobApplications", () => ({
  useJobApplications: () => applicationsQuery,
}));
vi.mock("../../hooks/useInterviews", () => ({
  useInterviewsForMonth: () => interviewsQuery,
}));
vi.mock("../../layouts/ApplicationShell/ApplicationShell", () => ({
  ApplicationShell: ({ children, navigation }: { children: React.ReactNode; navigation: React.ReactNode }) => <>{navigation}{children}</>,
}));
vi.mock("../../components/organisms/ApplicationNavigation/ApplicationNavigation", () => ({
  ApplicationNavigation: ({ activeDestination }: { activeDestination: string }) => <p>Active destination: {activeDestination}</p>,
}));
vi.mock("../../components/atoms/AnimatedSidebar/AnimatedSidebar", () => ({
  AnimatedSidebarTrigger: () => <button type="button">Toggle sidebar</button>,
}));
vi.mock("../../components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid", () => ({
  WorkspaceEngineeringGrid: () => null,
}));
vi.mock("../../components/organisms/MonthInterviewCalendar/MonthInterviewCalendar", () => ({
  MonthInterviewCalendar: ({ applicationLabels, interviews, onOpenApplication }: { applicationLabels: Map<string, { company: string }>; interviews: Array<{ job_application_id: string; round_label: string }>; onOpenApplication: (applicationId: string) => void }) => (
    <>
      <p>Calendar: {applicationLabels.get("application-1")?.company} · {interviews[0]?.round_label}</p>
      <button type="button" onClick={() => onOpenApplication(interviews[0]?.job_application_id)}>Open test application</button>
    </>
  ),
}));

describe("InterviewCalendarPage", () => {
  beforeEach(() => {
    applicationsQuery.data = [];
    applicationsQuery.isError = false;
    applicationsQuery.isPending = false;
    interviewsQuery.data = [];
    interviewsQuery.isError = false;
    interviewsQuery.isPending = false;
    navigate.mockReset();
  });

  it("announces loading interviews with Calendar active", () => {
    interviewsQuery.isPending = true;
    render(<InterviewCalendarPage />);

    expect(screen.getByText("Active destination: calendar")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading interviews…");
  });

  it("shows an interview query error", () => {
    interviewsQuery.isError = true;
    render(<InterviewCalendarPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not load interviews. Please try again.");
  });

  it("shows an empty month", () => {
    render(<InterviewCalendarPage />);

    expect(screen.getByText("No interviews scheduled this month.")).toBeInTheDocument();
    expect(screen.getByText("Calendar: ·")).toBeInTheDocument();
  });

  it("passes application labels and interviews into the month calendar", () => {
    applicationsQuery.data = [{ id: "application-1", company: "Acme", position: "Frontend Engineer", status: "interview" }];
    interviewsQuery.data = [{ id: "interview-1", job_application_id: "application-1", round_label: "Technical" }];
    render(<InterviewCalendarPage />);

    expect(screen.getByText("Calendar: Acme · Technical")).toBeInTheDocument();
  });

  it("navigates to the selected application's detail drawer", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    applicationsQuery.data = [{ id: "application-1", company: "Acme", position: "Frontend Engineer", status: "interview" }];
    interviewsQuery.data = [{ id: "interview-1", job_application_id: "application-1", round_label: "Technical" }];
    render(<InterviewCalendarPage />);

    await user.click(screen.getByRole("button", { name: "Open test application" }));
    expect(navigate).toHaveBeenCalledWith({ search: { applicationId: "application-1" }, to: "/" });
  });
});
