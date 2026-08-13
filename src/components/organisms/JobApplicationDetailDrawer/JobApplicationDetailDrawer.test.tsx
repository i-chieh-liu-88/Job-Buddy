import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import type { UpdateJobApplicationInput } from "../../../hooks/useJobApplications";
import type { JobApplication } from "../../../types/database";
import { JobApplicationDetailDrawer } from "./JobApplicationDetailDrawer";

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

type DrawerProps = ComponentProps<typeof JobApplicationDetailDrawer>;

function renderDrawer(overrides: Partial<DrawerProps> = {}) {
  const props: DrawerProps = {
    application,
    hasDeleteError: false,
    hasSaveError: false,
    isDeleting: false,
    isSaving: false,
    onDelete: vi.fn().mockResolvedValue(undefined),
    onExitComplete: vi.fn(),
    onOpenChange: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    open: true,
    ...overrides,
  };
  const rendered = render(
    <JobApplicationDetailDrawer
      {...props}
    />,
  );

  return { ...rendered, props };
}

describe("JobApplicationDetailDrawer", () => {
  it("renders a right-side single-column detail drawer", () => {
    renderDrawer();
    const drawer = screen.getByRole("dialog", {
      name: "Edit Frontend Engineer",
    });

    expect(drawer).toHaveClass("right-0", "md:w-[32.5rem]");
    expect(drawer).toHaveClass("w-[calc(100vw-0.5rem)]");
    expect(
      screen.getByRole("group", { name: "Application details" }),
    ).not.toHaveClass("md:grid-cols-2");
  });

  it("groups destructive, neutral, and primary application actions", () => {
    renderDrawer();

    const actions = screen.getByRole("group", {
      name: "Application actions",
    });

    for (const name of ["Delete", "Cancel", "Save changes"]) {
      expect(within(actions).getByRole("button", { name })).toBeVisible();
    }
  });

  it("focuses Company after the drawer opens", async () => {
    renderDrawer();

    await waitFor(() => expect(screen.getByLabelText("Company")).toHaveFocus());
  });

  it("prefills the application and closes through Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    expect(
      screen.getByRole("dialog", { name: "Edit Frontend Engineer" }),
    ).toHaveAttribute("aria-modal", "true");
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

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes through Escape when idle", () => {
    const { props } = renderDrawer();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes through the close control when idle", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "Close drawer" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("prevents saving when Company or Position is missing", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    await user.clear(screen.getByLabelText("Company"));
    await user.clear(screen.getByLabelText("Position"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Company is required.")).toBeVisible();
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("prevents saving a whitespace-only Company after trimming", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    await user.clear(screen.getByLabelText("Company"));
    await user.type(screen.getByLabelText("Company"), "   ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Company is required.")).toBeVisible();
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("uses Zod instead of native browser validation", () => {
    renderDrawer();

    expect(screen.getByRole("button", { name: "Save changes" }).closest("form"))
      .toHaveAttribute("novalidate");
  });

  it("associates, focuses, and clears a malformed URL error", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();
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
    const { props } = renderDrawer();
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
    const { props } = renderDrawer({ onSave });

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
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the edited draft open after a rejected save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("save failed"));
    const { rerender, props } = renderDrawer({ onSave });

    await user.clear(screen.getByLabelText("Company"));
    await user.type(screen.getByLabelText("Company"), "Edited Acme");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    rerender(
      <JobApplicationDetailDrawer
        application={application}
        hasDeleteError={false}
        hasSaveError
        isDeleting={false}
        isSaving={false}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onExitComplete={props.onExitComplete}
        onOpenChange={props.onOpenChange}
        onSave={onSave}
        open
      />,
    );

    expect(
      screen.getByText("The application could not be saved. Please try again."),
    ).toBeVisible();
    expect(screen.getByLabelText("Company")).toHaveValue("Edited Acme");
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("requires a second delete confirmation and closes after deletion", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { props } = renderDrawer({ onDelete });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText("Delete Acme?")).toBeVisible();
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel delete" }));
    expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("application-1"));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("moves focus into delete confirmation and restores it when cancelled", async () => {
    const user = userEvent.setup();
    renderDrawer();

    expect(screen.getByLabelText("Company")).toHaveFocus();
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    await user.click(deleteButton);

    const confirmation = screen.getByRole("group", {
      name: "Delete confirmation",
    });
    expect(
      within(confirmation).getByRole("button", { name: "Cancel delete" }),
    ).toBeVisible();
    expect(
      within(confirmation).getByRole("button", { name: "Confirm delete" }),
    ).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent("Delete Acme?");

    await user.click(screen.getByRole("button", { name: "Cancel delete" }));

    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });

  it("keeps the drawer open after a rejected deletion", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockRejectedValue(new Error("delete failed"));
    const { rerender, props } = renderDrawer({ onDelete });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
    rerender(
      <JobApplicationDetailDrawer
        application={application}
        hasDeleteError
        hasSaveError={false}
        isDeleting={false}
        isSaving={false}
        onDelete={onDelete}
        onExitComplete={props.onExitComplete}
        onOpenChange={props.onOpenChange}
        onSave={vi.fn().mockResolvedValue(undefined)}
        open
      />,
    );

    expect(
      screen.getByText("The application could not be deleted. Please try again."),
    ).toBeVisible();
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("disables controls and blocks every closing action while pending", () => {
    const { props } = renderDrawer({ isSaving: true });

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByTestId("drawer-backdrop"));

    expect(screen.getByLabelText("Company")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close drawer" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving…" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });
});
