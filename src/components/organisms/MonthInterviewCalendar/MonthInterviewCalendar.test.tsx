import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthInterviewCalendar } from "./MonthInterviewCalendar";
import type { Interview } from "../../../types/database";

const technicalInterview: Interview = {
  id: "interview-1",
  user_id: "user-1",
  job_application_id: "application-1",
  round_label: "Technical",
  scheduled_at: new Date(2026, 7, 11, 9, 30).toISOString(),
  location_or_link: null,
  notes: null,
  created_at: "2026-08-01T00:00:00.000Z",
};

function renderCalendar(overrides?: Partial<React.ComponentProps<typeof MonthInterviewCalendar>>) {
  const onMonthChange = vi.fn();
  const onOpenApplication = vi.fn();
  const result = render(
    <MonthInterviewCalendar
      applicationLabels={new Map([["application-1", { company: "Acme", position: "Frontend Engineer" }]])}
      interviews={[technicalInterview]}
      month={new Date(2026, 7, 1)}
      onMonthChange={onMonthChange}
      onOpenApplication={onOpenApplication}
      {...overrides}
    />,
  );

  return { ...result, onMonthChange, onOpenApplication };
}

describe("MonthInterviewCalendar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a Monday-first six-week month grid with interview rows", () => {
    renderCalendar();

    expect(screen.getAllByRole("gridcell")).toHaveLength(42);
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Mon");
    expect(screen.getByText("Technical")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  it("marks the current local day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 11, 12));
    renderCalendar();

    expect(screen.getByLabelText("Today, August 11, 2026")).toBeInTheDocument();
  });

  it("changes months through its controls", async () => {
    const user = userEvent.setup();
    const { onMonthChange } = renderCalendar();

    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 6, 1));

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 8, 1));

    await user.click(screen.getByRole("button", { name: "Today" }));
    const todayCall = onMonthChange.mock.calls.at(-1)?.[0] as Date;
    expect(todayCall.getDate()).toBe(1);
    expect(todayCall.getMonth()).toBe(new Date().getMonth());
  });

  it("communicates extra events within one day", () => {
    const interviews = [0, 1, 2].map((index) => ({
      ...technicalInterview,
      id: `interview-${index}`,
      round_label: `Round ${index + 1}`,
    }));
    renderCalendar({ interviews });

    expect(screen.getByText("+1 more")).toBeInTheDocument();
    const augustEleventh = screen.getByLabelText("August 11, 2026");
    expect(within(augustEleventh).getByText("Round 1")).toBeInTheDocument();
  });

  it("opens an application from an interview event", async () => {
    const user = userEvent.setup();
    const { onOpenApplication } = renderCalendar();

    await user.hover(screen.getByRole("button", { name: /Technical at Acme/i }));
    await user.click(await screen.findByRole("button", { name: "Open application" }));

    expect(onOpenApplication).toHaveBeenCalledWith("application-1");
  });
});
