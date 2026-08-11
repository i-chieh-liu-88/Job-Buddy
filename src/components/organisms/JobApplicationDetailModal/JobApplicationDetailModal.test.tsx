import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import type { UpdateJobApplicationInput } from "../../../hooks/useJobApplications";
import type { JobApplication } from "../../../types/database";
import { JobApplicationDetailModal } from "./JobApplicationDetailModal";

const application: JobApplication = {
  id: "application-1",
  user_id: "user-1",
  company: "Acme",
  position: "Frontend Engineer",
  job_url: "https://example.com/jobs/frontend-engineer",
  status: "interview",
  applied_date: "2026-08-01",
  notes: "Bring portfolio",
  resume_version: "v3",
  order_index: 1_000,
  created_at: "2026-08-11T00:00:00.000Z",
  updated_at: "2026-08-11T00:00:00.000Z",
};

type ModalProps = ComponentProps<typeof JobApplicationDetailModal>;

function renderModal(overrides: Partial<ModalProps> = {}) {
  const props: ModalProps = {
    application,
    hasDeleteError: false,
    hasSaveError: false,
    isDeleting: false,
    isSaving: false,
    onClose: vi.fn(),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onSave: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const rendered = render(
    <JobApplicationDetailModal
      {...props}
    />,
  );

  return { ...rendered, props };
}

describe("JobApplicationDetailModal", () => {
  it("prefills the application and closes through Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(
      screen.getByRole("heading", { name: "Edit Frontend Engineer" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Company")).toHaveValue("Acme");
    expect(screen.getByLabelText("Position")).toHaveValue("Frontend Engineer");
    expect(screen.getByLabelText("Job URL")).toHaveValue(
      "https://example.com/jobs/frontend-engineer",
    );
    expect(screen.getByLabelText("Status")).toHaveValue("interview");
    expect(screen.getByLabelText("Applied date")).toHaveValue("2026-08-01");
    expect(screen.getByLabelText("Notes")).toHaveValue("Bring portfolio");
    expect(screen.getByLabelText("Resume version")).toHaveValue("v3");
    expect(screen.getByLabelText("Company")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("closes through the native cancel event when idle", () => {
    const { props } = renderModal();

    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("prevents saving when Company or Position is missing", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.clear(screen.getByLabelText("Company"));
    await user.clear(screen.getByLabelText("Position"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Company is required.")).toBeVisible();
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("prevents saving a whitespace-only Company after trimming", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.clear(screen.getByLabelText("Company"));
    await user.type(screen.getByLabelText("Company"), "   ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Company is required.")).toBeVisible();
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("uses Zod instead of native browser validation", () => {
    renderModal();

    expect(screen.getByRole("button", { name: "Save changes" }).closest("form"))
      .toHaveAttribute("novalidate");
  });

  it("associates, focuses, and clears a malformed URL error", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    const jobUrlInput = screen.getByLabelText("Job URL");

    await user.clear(jobUrlInput);
    await user.type(jobUrlInput, "not a URL");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Enter a valid URL.")).toBeVisible();
    expect(jobUrlInput).toHaveFocus();
    expect(jobUrlInput).toHaveAttribute("aria-invalid", "true");
    expect(jobUrlInput).toHaveAttribute(
      "aria-describedby",
      "application-job-url-error",
    );
    expect(props.onSave).not.toHaveBeenCalled();

    await user.clear(jobUrlInput);
    await user.type(jobUrlInput, "https://example.com/jobs/1");

    expect(jobUrlInput).not.toHaveAttribute("aria-invalid");
    expect(jobUrlInput).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText("Enter a valid URL.")).not.toBeInTheDocument();
  });

  it("focuses the first custom-invalid field and associates required errors", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    const companyInput = screen.getByLabelText("Company");
    const positionInput = screen.getByLabelText("Position");

    await user.clear(companyInput);
    await user.type(companyInput, "   ");
    await user.clear(positionInput);
    await user.type(positionInput, "   ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(companyInput).toHaveFocus();
    expect(companyInput).toHaveAttribute("aria-invalid", "true");
    expect(companyInput).toHaveAttribute(
      "aria-describedby",
      "application-company-error",
    );
    expect(screen.getByText("Company is required.")).toHaveAttribute(
      "id",
      "application-company-error",
    );
    expect(positionInput).toHaveAttribute("aria-invalid", "true");
    expect(positionInput).toHaveAttribute(
      "aria-describedby",
      "application-position-error",
    );
    expect(screen.getByText("Position is required.")).toHaveAttribute(
      "id",
      "application-position-error",
    );
    expect(props.onSave).not.toHaveBeenCalled();

    await user.clear(companyInput);
    await user.type(companyInput, "Acme");
    expect(companyInput).not.toHaveAttribute("aria-invalid");
    expect(companyInput).not.toHaveAttribute("aria-describedby");

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(positionInput).toHaveFocus();
  });

  it("normalizes the edited draft and closes after saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn<(input: UpdateJobApplicationInput) => Promise<unknown>>()
      .mockResolvedValue(undefined);
    renderModal({ onSave });

    await user.clear(screen.getByLabelText("Company"));
    await user.type(screen.getByLabelText("Company"), "  New Acme  ");
    await user.clear(screen.getByLabelText("Position"));
    await user.type(screen.getByLabelText("Position"), "  Staff Engineer  ");
    await user.clear(screen.getByLabelText("Job URL"));
    await user.type(screen.getByLabelText("Job URL"), "  https://example.com/new  ");
    await user.selectOptions(screen.getByLabelText("Status"), "offer");
    await user.clear(screen.getByLabelText("Applied date"));
    await user.clear(screen.getByLabelText("Notes"));
    await user.type(screen.getByLabelText("Notes"), "  Keep spacing  ");
    await user.clear(screen.getByLabelText("Resume version"));
    await user.type(screen.getByLabelText("Resume version"), "  v4  ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        id: "application-1",
        company: "New Acme",
        position: "Staff Engineer",
        job_url: "https://example.com/new",
        status: "offer",
        applied_date: null,
        notes: "  Keep spacing  ",
        resume_version: "v4",
      });
    });
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute(
      "open",
    );
  });

  it("keeps the edited draft open after a rejected save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("save failed"));
    const { rerender } = renderModal({ onSave });

    await user.clear(screen.getByLabelText("Company"));
    await user.type(screen.getByLabelText("Company"), "Edited Acme");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    rerender(
      <JobApplicationDetailModal
        application={application}
        hasDeleteError={false}
        hasSaveError
        isDeleting={false}
        isSaving={false}
        onClose={vi.fn()}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onSave={onSave}
      />,
    );

    expect(
      screen.getByText("The application could not be saved. Please try again."),
    ).toBeVisible();
    expect(screen.getByLabelText("Company")).toHaveValue("Edited Acme");
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("requires a second delete confirmation and closes after deletion", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderModal({ onDelete });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText("Delete Acme?")).toBeVisible();
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel delete" }));
    expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("application-1"));
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute(
      "open",
    );
  });

  it("moves focus into delete confirmation and restores it when cancelled", async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getByLabelText("Company")).toHaveFocus();
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    await user.click(deleteButton);

    expect(screen.getByRole("button", { name: "Confirm delete" })).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent("Delete Acme?");

    await user.click(screen.getByRole("button", { name: "Cancel delete" }));

    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });

  it("keeps the dialog open after a rejected deletion", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockRejectedValue(new Error("delete failed"));
    const { rerender } = renderModal({ onDelete });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
    rerender(
      <JobApplicationDetailModal
        application={application}
        hasDeleteError
        hasSaveError={false}
        isDeleting={false}
        isSaving={false}
        onClose={vi.fn()}
        onDelete={onDelete}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(
      screen.getByText("The application could not be deleted. Please try again."),
    ).toBeVisible();
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("disables controls while a mutation is pending", () => {
    renderModal({ isSaving: true });

    expect(screen.getByLabelText("Company")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });
});
