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
    resume_id: null,
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
    resume_id: "resume-2",
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
      .getByRole("heading", { name: "Saved (1)" })
      .closest("section");
    const interviewColumn = screen
      .getByRole("heading", { name: "Interview (1)" })
      .closest("section");

    expect(savedColumn).not.toBeNull();
    expect(interviewColumn).not.toBeNull();
    expect(savedColumn?.parentElement).toHaveClass("min-w-0");
    expect(savedColumn?.parentElement?.parentElement).toHaveClass(
      "md:grid-cols-5",
    );
    expect(savedColumn?.parentElement?.parentElement).not.toHaveClass(
      "md:min-w-max",
    );
    expect(within(savedColumn!).getByText("Frontend Engineer")).toBeVisible();
    expect(within(interviewColumn!).getByText("Product Engineer")).toBeVisible();
    expect(screen.getByRole("region", { name: "Offer (0)" })).toHaveTextContent(
      "No applications yet",
    );
    expect(screen.getByTestId("status-ping-saved")).toHaveClass(
      "animate-ping",
    );
    expect(screen.getByTestId("status-ping-applied")).toHaveClass(
      "animate-ping",
    );
  });

  it("offers the add action only from an empty Saved column", async () => {
    const onAddApplication = vi.fn();
    const user = userEvent.setup();

    render(
      <KanbanBoard
        applications={applications.filter(({ status }) => status !== "saved")}
        onAddApplication={onAddApplication}
        onReorder={vi.fn()}
      />,
    );

    const savedColumn = screen.getByRole("region", { name: "Saved (0)" });
    const addButton = within(savedColumn).getByRole("button", {
      name: "Add application",
    });
    const label = within(addButton).getByText("Add application");
    const plusIcon = addButton.querySelector("svg[aria-hidden='true']");

    expect(addButton).toHaveClass("normal-case!");
    expect(label).toHaveClass("font-sans!", "text-sm!", "font-normal!");
    expect(plusIcon).toHaveAttribute("stroke-width", "1.25");
    await user.click(addButton);

    expect(onAddApplication).toHaveBeenCalledWith(addButton);
    expect(
      within(screen.getByRole("region", { name: "Applied (0)" })).queryByRole(
        "button",
        { name: "Add application" },
      ),
    ).not.toBeInTheDocument();
  });

  it("disables the Saved empty-state add action when creation is disabled", () => {
    render(
      <KanbanBoard
        applications={applications.filter(({ status }) => status !== "saved")}
        isAddDisabled
        onAddApplication={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Add application" }),
    ).toBeDisabled();
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

    const opener = screen.getByRole("button", {
      name: "Open Frontend Engineer at Acme",
    });
    await user.click(opener);

    expect(onSelectApplication).toHaveBeenCalledWith(applications[0], opener);
  });

  it("keeps the card selection control safe when no page callback is provided", async () => {
    const user = userEvent.setup();

    render(<KanbanBoard applications={applications} onReorder={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
    );
  });
});
