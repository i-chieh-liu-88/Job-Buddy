import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InterviewEventPopover } from "./InterviewEventPopover";
import type { Interview } from "../../../types/database";

const interview: Interview = {
  created_at: "2026-08-01T00:00:00.000Z",
  id: "interview-1",
  job_application_id: "application-1",
  location_or_link: "https://meet.example.com/technical",
  notes: "Bring the portfolio walkthrough.",
  round_label: "Technical",
  scheduled_at: new Date(2026, 7, 11, 9, 30).toISOString(),
  user_id: "user-1",
};

describe("InterviewEventPopover", () => {
  it("opens round details in a morphing modal and opens its application", async () => {
    const user = userEvent.setup();
    const onOpenApplication = vi.fn();

    render(
      <InterviewEventPopover
        company="Acme"
        interview={interview}
        onOpenApplication={onOpenApplication}
        position="Frontend Engineer"
      />,
    );

    const eventButton = screen.getByRole("button", { name: /Technical at Acme/i });

    await user.hover(eventButton);
    expect(screen.queryByTestId("interview-event-modal")).not.toBeInTheDocument();

    await user.click(eventButton);
    expect(await screen.findByTestId("interview-event-modal")).toHaveTextContent("Frontend Engineer");
    expect(screen.getByTestId("interview-event-modal")).toHaveTextContent("Bring the portfolio walkthrough.");

    await user.click(screen.getByRole("button", { name: "Open application" }));
    expect(onOpenApplication).toHaveBeenCalledWith("application-1");
  });
});
