import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UpdateJobApplicationInput } from "../../../hooks/useJobApplications";
import type { JobApplication } from "../../../types/database";
import type { Resume } from "../../../types/database";
import { JobApplicationDetailDrawer } from "./JobApplicationDetailDrawer";

const { openResumeMutateAsync, useOpenResumeMock } = vi.hoisted(() => ({
  openResumeMutateAsync: vi.fn(),
  useOpenResumeMock: vi.fn(),
}));

vi.mock("../../../hooks/useResumes", () => ({
  useOpenResume: useOpenResumeMock,
}));

vi.mock("../InterviewRounds/InterviewRounds", () => ({
  InterviewRounds: ({ jobApplicationId }: { jobApplicationId: string }) => (
    <section aria-label="Interview rounds">
      <button type="button">Add interview round</button>
      <span>{jobApplicationId}</span>
    </section>
  ),
}));

const application: JobApplication = {
  id: "application-1",
  user_id: "user-1",
  company: "Acme",
  position: "Frontend Engineer",
  job_url: "https://example.com/jobs/frontend-engineer",
  status: "interview",
  applied_date: "2026-08-01",
  notes: "Bring portfolio",
  resume_id: "11111111-1111-4111-8111-111111111111",
  order_index: 1_000,
  created_at: "2026-08-11T00:00:00.000Z",
  updated_at: "2026-08-11T00:00:00.000Z",
};

const resumes: Resume[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user-1",
    label: "Frontend v2",
    file_path: "user-1/resume-1/frontend-v2.pdf",
    file_type: "application/pdf",
    file_size: 1_024,
    uploaded_at: "2026-08-13T00:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: "user-1",
    label: "General v1",
    file_path: "user-1/resume-2/general-v1.pdf",
    file_type: "application/pdf",
    file_size: 2_048,
    uploaded_at: "2026-08-12T00:00:00.000Z",
  },
];

type DrawerProps = ComponentProps<typeof JobApplicationDetailDrawer>;

function renderDrawer(overrides: Partial<DrawerProps> = {}) {
  const props: DrawerProps = {
    application,
    hasDeleteError: false,
    hasSaveError: false,
    hasResumesError: false,
    isDeleting: false,
    isResumesLoading: false,
    isSaving: false,
    onDelete: vi.fn().mockResolvedValue(undefined),
    onExitComplete: vi.fn(),
    onOpenChange: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    open: true,
    resumes,
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
  beforeEach(() => {
    openResumeMutateAsync.mockReset();
    openResumeMutateAsync.mockResolvedValue(undefined);
    useOpenResumeMock.mockReturnValue({
      isError: false,
      isPending: false,
      mutateAsync: openResumeMutateAsync,
    });
  });

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
    expect(screen.getByLabelText("Resume")).toHaveValue(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(screen.queryByLabelText("Resume version")).not.toBeInTheDocument();
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
        resume_id: "11111111-1111-4111-8111-111111111111",
      });
    });
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("preserves an unsaved application draft while the interview section is used", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    await user.clear(screen.getByLabelText("Company"));
    await user.type(screen.getByLabelText("Company"), "Unsaved Acme");
    await user.click(screen.getByRole("button", { name: "Add interview round" }));

    expect(screen.getByLabelText("Company")).toHaveValue("Unsaved Acme");
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("opens the currently linked resume without changing the application", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "Open resume" }));

    await waitFor(() => {
      expect(openResumeMutateAsync).toHaveBeenCalledWith(resumes[0]);
    });
    expect(props.onSave).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it("hides the resume action when the application has no linked resume", () => {
    renderDrawer({ application: { ...application, resume_id: null } });

    expect(
      screen.queryByRole("button", { name: "Open resume" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the drawer open and shows a retryable error when opening fails", async () => {
    const user = userEvent.setup();
    openResumeMutateAsync.mockRejectedValue(new Error("signed URL failed"));
    const { props, rerender } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "Open resume" }));
    await waitFor(() => expect(openResumeMutateAsync).toHaveBeenCalledOnce());

    useOpenResumeMock.mockReturnValue({
      isError: true,
      isPending: false,
      mutateAsync: openResumeMutateAsync,
    });
    rerender(<JobApplicationDetailDrawer {...props} />);

    expect(
      screen.getByText("The resume could not be opened. Please try again."),
    ).toBeVisible();
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("replaces and unlinks the selected resume through the save payload", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderDrawer({ onSave });

    await user.selectOptions(screen.getByLabelText("Resume"), resumes[1].id);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ resume_id: resumes[1].id }),
      ),
    );

    rerender(
      <JobApplicationDetailDrawer
        application={{ ...application, resume_id: resumes[1].id }}
        hasDeleteError={false}
        hasResumesError={false}
        hasSaveError={false}
        isDeleting={false}
        isResumesLoading={false}
        isSaving={false}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onExitComplete={vi.fn()}
        onOpenChange={vi.fn()}
        onSave={onSave}
        open
        resumes={resumes}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Resume"), "");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenLastCalledWith(
        expect.objectContaining({ resume_id: null }),
      ),
    );
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
        hasResumesError={false}
        hasSaveError
        isDeleting={false}
        isResumesLoading={false}
        isSaving={false}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onExitComplete={props.onExitComplete}
        onOpenChange={props.onOpenChange}
        onSave={onSave}
        open
        resumes={resumes}
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
        hasResumesError={false}
        hasSaveError={false}
        isDeleting={false}
        isResumesLoading={false}
        isSaving={false}
        onDelete={onDelete}
        onExitComplete={props.onExitComplete}
        onOpenChange={props.onOpenChange}
        onSave={vi.fn().mockResolvedValue(undefined)}
        open
        resumes={resumes}
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
