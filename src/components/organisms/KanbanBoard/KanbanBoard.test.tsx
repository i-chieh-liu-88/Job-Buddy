import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { JobApplication } from "../../../types/database";
import { KanbanBoard } from "./KanbanBoard";

const applications: JobApplication[] = [
  {
    id: "application-1",
    user_id: "user-1",
    company: "Acme",
    position: "Frontend Engineer",
    job_url: null,
    status: "saved",
    applied_date: null,
    notes: null,
    resume_version: null,
    order_index: 1_000,
    created_at: "2026-08-11T00:00:00.000Z",
    updated_at: "2026-08-11T00:00:00.000Z",
  },
  {
    id: "application-2",
    user_id: "user-1",
    company: "Globex",
    position: "Product Engineer",
    job_url: null,
    status: "interview",
    applied_date: "2026-08-10",
    notes: null,
    resume_version: "product-v2",
    order_index: 1_000,
    created_at: "2026-08-11T00:00:00.000Z",
    updated_at: "2026-08-11T00:00:00.000Z",
  },
];

describe("KanbanBoard", () => {
  it("renders every stage and groups cards by status", () => {
    render(
      <KanbanBoard
        applications={applications}
        onReorder={vi.fn()}
        onSelectApplication={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(5);

    const savedColumn = screen
      .getByRole("heading", { name: "Saved" })
      .closest("section");
    const interviewColumn = screen
      .getByRole("heading", { name: "Interview" })
      .closest("section");

    expect(savedColumn).not.toBeNull();
    expect(interviewColumn).not.toBeNull();
    expect(within(savedColumn!).getByText("Frontend Engineer")).toBeVisible();
    expect(within(interviewColumn!).getByText("Product Engineer")).toBeVisible();
    expect(screen.getByRole("region", { name: "Offer" })).toHaveTextContent(
      "Drop a card here",
    );
  });

  it("selects the application from its card content button", async () => {
    const onSelectApplication = vi.fn();
    const user = userEvent.setup();

    render(
      <KanbanBoard
        applications={applications}
        onReorder={vi.fn()}
        onSelectApplication={onSelectApplication}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
    );

    expect(onSelectApplication).toHaveBeenCalledWith(applications[0]);
  });

  it("keeps the card selection control safe when no page callback is provided", async () => {
    const user = userEvent.setup();

    render(<KanbanBoard applications={applications} onReorder={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
    );
  });
});
