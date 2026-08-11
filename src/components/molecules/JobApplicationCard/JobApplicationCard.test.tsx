import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { JobApplication } from "../../../types/database";
import {
  JobApplicationCard,
  JobApplicationCardPreview,
} from "./JobApplicationCard";

const sortableListeners = {
  onPointerDown: vi.fn(),
};
const setActivatorNodeRef = vi.fn();

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: vi.fn(() => ({
    attributes: { "data-sortable-attributes": "present" },
    isDragging: false,
    listeners: sortableListeners,
    setActivatorNodeRef,
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  })),
}));

const application: JobApplication = {
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
};

describe("JobApplicationCardPreview", () => {
  it("renders drag feedback without an interactive sortable role", () => {
    render(<JobApplicationCardPreview application={application} />);

    expect(
      screen.getByLabelText("Frontend Engineer at Acme"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("JobApplicationCard", () => {
  it("selects from its content button and assigns the drag activator to its handle", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<JobApplicationCard application={application} onSelect={onSelect} />);

    const openButton = screen.getByRole("button", {
      name: "Open Frontend Engineer at Acme",
    });
    const dragButton = screen.getByRole("button", {
      name: "Drag Frontend Engineer at Acme",
    });

    await user.click(openButton);

    expect(onSelect).toHaveBeenCalledWith(application, openButton);
    expect(sortableListeners.onPointerDown).not.toHaveBeenCalled();
    expect(dragButton).toHaveAttribute("data-sortable-attributes", "present");
    expect(dragButton).toHaveClass("touch-none");
    expect(openButton).not.toHaveAttribute("data-sortable-attributes");
    expect(setActivatorNodeRef).toHaveBeenCalledWith(dragButton);
  });

  it("marks the opener by application and keeps phrasing content inside it", () => {
    render(
      <JobApplicationCard application={application} onSelect={vi.fn()} />,
    );

    const openButton = screen.getByRole("button", {
      name: "Open Frontend Engineer at Acme",
    });

    expect(openButton).toHaveAttribute(
      "data-application-opener",
      "application-1",
    );
    expect(openButton.querySelector("div, h3, p")).toBeNull();
    expect(openButton).toHaveTextContent("Frontend Engineer");
    expect(openButton).toHaveTextContent("Acme");
  });

  it("disables both card controls when dragging is disabled", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <JobApplicationCard
        application={application}
        isDisabled
        onSelect={onSelect}
      />,
    );

    const openButton = screen.getByRole("button", {
      name: "Open Frontend Engineer at Acme",
    });
    const dragButton = screen.getByRole("button", {
      name: "Drag Frontend Engineer at Acme",
    });

    await user.click(openButton);

    expect(openButton).toBeDisabled();
    expect(dragButton).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
