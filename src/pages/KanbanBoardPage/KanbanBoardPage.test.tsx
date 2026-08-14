import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobApplication } from "../../types/database";
import { KanbanBoardPage } from "./KanbanBoardPage";

const {
  createMutateAsync,
  createReset,
  deleteMutateAsync,
  deleteReset,
  updateMutateAsync,
  updateReset,
  useCreateJobApplicationMock,
  useDeleteJobApplicationMock,
  useJobApplicationsMock,
  useResumesMock,
  useUpdateJobApplicationMock,
  search,
} = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  createReset: vi.fn(),
  deleteMutateAsync: vi.fn(),
  deleteReset: vi.fn(),
  updateMutateAsync: vi.fn(),
  updateReset: vi.fn(),
  useCreateJobApplicationMock: vi.fn(),
  useDeleteJobApplicationMock: vi.fn(),
  useJobApplicationsMock: vi.fn(),
  useResumesMock: vi.fn(),
  useUpdateJobApplicationMock: vi.fn(),
  search: {} as { applicationId?: string },
}));

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
    applied_date: null,
    notes: null,
    resume_id: null,
    order_index: 2_000,
    created_at: "2026-08-11T00:00:00.000Z",
    updated_at: "2026-08-11T00:00:00.000Z",
  },
];

function createDeferredMutation() {
  let resolveMutation!: () => void;
  const promise = new Promise<unknown>((resolve) => {
    resolveMutation = () => resolve(undefined);
  });

  return { promise, resolve: resolveMutation };
}

function completeDrawerExit() {
  fireEvent.click(screen.getByTestId("complete-drawer-exit"));
}

vi.mock("@clerk/clerk-react", () => ({
  UserButton: () => <button type="button" aria-label="Account menu" />,
}));

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => search,
}));

vi.mock("../../components/atoms/Drawer/Drawer", async () => {
  const { useEffect } = await import("react");

  function Drawer({
    open,
    onOpenChange,
    onExitComplete,
    ariaLabel,
    children,
    dismissable = true,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExitComplete?: () => void;
    ariaLabel?: string;
    children: ReactNode;
    dismissable?: boolean;
  }) {
    useEffect(() => {
      if (!open) return;

      function handleEscape(event: KeyboardEvent) {
        if (event.key === "Escape" && dismissable) onOpenChange(false);
      }

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [dismissable, onOpenChange, open]);

    return (
      <>
        <div
          data-testid="drawer-backdrop"
          onClick={() => dismissable && onOpenChange(false)}
        />
        <aside role="dialog" aria-modal="true" aria-label={ariaLabel}>
          {children}
          {!open ? (
            <button
              type="button"
              data-testid="complete-drawer-exit"
              onClick={onExitComplete}
            >
              Complete drawer exit
            </button>
          ) : null}
        </aside>
      </>
    );
  }

  return { Drawer };
});

vi.mock("../../components/organisms/InterviewRounds/InterviewRounds", () => ({
  InterviewRounds: () => null,
}));

vi.mock("../../hooks/useJobApplications", () => ({
  useCreateJobApplication: useCreateJobApplicationMock,
  useDeleteJobApplication: useDeleteJobApplicationMock,
  useJobApplications: useJobApplicationsMock,
  useReorderJobApplications: () => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  }),
  useUpdateJobApplication: useUpdateJobApplicationMock,
}));

vi.mock("../../hooks/useResumes", () => ({
  useOpenResume: () => ({
    isError: false,
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useResumes: useResumesMock,
}));

describe("KanbanBoardPage", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    createMutateAsync.mockReset();
    createMutateAsync.mockResolvedValue(undefined);
    createReset.mockReset();
    deleteMutateAsync.mockReset();
    deleteMutateAsync.mockResolvedValue(undefined);
    deleteReset.mockReset();
    updateMutateAsync.mockReset();
    updateMutateAsync.mockResolvedValue(undefined);
    updateReset.mockReset();
    search.applicationId = undefined;

    useJobApplicationsMock.mockReturnValue({
      data: applications,
      error: null,
      isError: false,
      isPending: false,
    });
    useResumesMock.mockReturnValue({
      data: [],
      isError: false,
      isPending: false,
    });
    useCreateJobApplicationMock.mockReturnValue({
      isError: false,
      isPending: false,
      mutateAsync: createMutateAsync,
      reset: createReset,
    });
    useUpdateJobApplicationMock.mockReturnValue({
      isError: false,
      isPending: false,
      mutateAsync: updateMutateAsync,
      reset: updateReset,
    });
    useDeleteJobApplicationMock.mockReturnValue({
      isError: false,
      isPending: false,
      mutateAsync: deleteMutateAsync,
      reset: deleteReset,
    });
  });

  it("shows the application workspace navigation with live stage counts", () => {
    render(<KanbanBoardPage />);

    const navigation = screen.getByRole("navigation", {
      name: "Applications",
    });

    expect(
      within(navigation).getByRole("link", { name: "Applications" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(navigation).getByText("Saved").closest("li"),
    ).toHaveTextContent("1");
    expect(
      within(navigation).getByText("Interview").closest("li"),
    ).toHaveTextContent("1");
  });

  it("renders the official sidebar toggle with the Applications workspace header", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);

    expect(screen.getByRole("button", { name: "Toggle sidebar" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByLabelText("Your job search workspace")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Keep moving forward." }),
    ).toBeVisible();
    expect(
      screen.getByLabelText(
        "Keep every opportunity organized, from the first saved role to the final decision.",
      ),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Toggle sidebar" }));

    expect(screen.getByRole("button", { name: "Toggle sidebar" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("layers the engineering grid behind the authenticated workspace", () => {
    render(<KanbanBoardPage />);

    expect(screen.getByTestId("workspace-engineering-grid")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Applications" })).toBeVisible();
  });

  it("uses the display typography token for the workspace heading", () => {
    render(<KanbanBoardPage />);

    expect(screen.getByRole("heading", { name: "Applications" })).toHaveClass(
      "font-display",
    );
  });

  it("restores Add focus to each exact navigation opener", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);
    const addButtons = screen.getAllByRole("button", {
      name: "Add application",
    });

    expect(addButtons).toHaveLength(2);

    for (const addButton of addButtons) {
      await user.click(addButton);
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(addButton).toHaveFocus());
    }
  });

  it("opens a fresh Add application dialog from the sidebar", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);

    await user.click(
      screen.getAllByRole("button", { name: "Add application" })[0],
    );

    expect(screen.getByRole("dialog", { name: "Add application" })).toBeVisible();
    expect(screen.getByLabelText("Company")).toHaveFocus();
    expect(createReset).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Account menu" })).toBeVisible();
  });

  it("opens Add application from the empty Saved state and restores its focus", async () => {
    const user = userEvent.setup();
    useJobApplicationsMock.mockReturnValue({
      data: applications.filter(({ status }) => status !== "saved"),
      error: null,
      isError: false,
      isPending: false,
    });
    render(<KanbanBoardPage />);

    const savedColumn = screen.getByRole("region", { name: "Saved (0)" });
    const emptyStateButton = within(savedColumn).getByRole("button", {
      name: "Add application",
    });

    await user.click(emptyStateButton);

    expect(screen.getByRole("dialog", { name: "Add application" })).toBeVisible();
    expect(screen.getByLabelText("Status")).toHaveValue("saved");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(emptyStateButton).toHaveFocus());
  });

  it("appends a new application after cards in the selected status", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);
    const addButton = screen.getAllByRole("button", {
      name: "Add application",
    })[0];

    await user.click(addButton);
    await user.type(screen.getByLabelText("Company"), "  New Acme  ");
    await user.type(screen.getByLabelText("Position"), "  Staff Engineer  ");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add application",
      }),
    );

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({
        company: "New Acme",
        position: "Staff Engineer",
        job_url: null,
        status: "saved",
        applied_date: null,
        notes: null,
        resume_id: null,
        order_index: 2_000,
      });
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(addButton).toHaveFocus());
  });

  it("starts ordering at 1000 when the selected status is empty", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);

    await user.click(
      screen.getAllByRole("button", { name: "Add application" })[0],
    );
    await user.type(screen.getByLabelText("Company"), "Acme");
    await user.type(screen.getByLabelText("Position"), "Engineer");
    await user.selectOptions(screen.getByLabelText("Status"), "offer");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add application",
      }),
    );

    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledOnce());
    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ status: "offer", order_index: 1_000 }),
    );
  });

  it("cancels creation without a mutation and restores Add focus", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);
    const addButton = screen.getAllByRole("button", {
      name: "Add application",
    })[0];

    await user.click(addButton);
    await user.type(screen.getByLabelText("Company"), "Unsaved");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(createMutateAsync).not.toHaveBeenCalled();
    await waitFor(() => expect(createReset).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(addButton).toHaveFocus());
  });

  it("keeps the Add draft visible after a rejected create", async () => {
    const user = userEvent.setup();
    createMutateAsync.mockRejectedValue(new Error("create failed"));
    const { rerender } = render(<KanbanBoardPage />);

    await user.click(
      screen.getAllByRole("button", { name: "Add application" })[0],
    );
    await user.type(screen.getByLabelText("Company"), "Acme draft");
    await user.type(screen.getByLabelText("Position"), "Engineer");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Add application",
      }),
    );
    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledOnce());

    useCreateJobApplicationMock.mockReturnValue({
      isError: true,
      isPending: false,
      mutateAsync: createMutateAsync,
      reset: createReset,
    });
    rerender(<KanbanBoardPage />);

    expect(
      screen.getByText("The application could not be created. Please try again."),
    ).toBeVisible();
    expect(screen.getByLabelText("Company")).toHaveValue("Acme draft");
    expect(screen.getByRole("dialog", { name: "Add application" })).toBeVisible();
  });

  it("appends a moved application after destination cards before saving", async () => {
    const user = userEvent.setup();
    const deferredUpdate = createDeferredMutation();
    updateMutateAsync.mockReturnValue(deferredUpdate.promise);
    const { rerender } = render(<KanbanBoardPage />);
    const originalOpener = screen.getByRole("button", {
      name: "Open Frontend Engineer at Acme",
    });

    await user.click(originalOpener);

    expect(
      screen.getByRole("heading", { name: "Edit Frontend Engineer" }),
    ).toBeVisible();
    await user.selectOptions(screen.getByLabelText("Status"), "interview");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: "application-1",
        company: "Acme",
        position: "Frontend Engineer",
        job_url: null,
        status: "interview",
        applied_date: null,
        notes: null,
        resume_id: null,
        order_index: 3_000,
      });
    });

    useJobApplicationsMock.mockReturnValue({
      data: applications.map((application) =>
        application.id === "application-1"
          ? { ...application, order_index: 3_000, status: "interview" as const }
          : application,
      ),
      error: null,
      isError: false,
      isPending: false,
    });
    rerender(<KanbanBoardPage />);

    const replacementOpener = screen.getByRole("button", {
      name: "Open Frontend Engineer at Acme",
    });
    expect(replacementOpener).not.toBe(originalOpener);
    expect(originalOpener).not.toBeInTheDocument();

    await act(async () => {
      deferredUpdate.resolve();
      await deferredUpdate.promise;
    });

    expect(screen.getByLabelText("Company")).toHaveValue("Acme");
    expect(replacementOpener).not.toHaveFocus();
    completeDrawerExit();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(replacementOpener).toHaveFocus());
  });

  it("resets mutations and closes without saving or deleting when cancelled", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);
    const originalOpener = screen.getByRole("button", {
      name: "Open Frontend Engineer at Acme",
    });

    await user.click(originalOpener);

    expect(updateReset).toHaveBeenCalledOnce();
    expect(deleteReset).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(updateMutateAsync).not.toHaveBeenCalled();
    expect(deleteMutateAsync).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Company")).toHaveValue("Acme");
    expect(originalOpener).not.toHaveFocus();
    expect(updateReset).toHaveBeenCalledTimes(2);
    expect(deleteReset).toHaveBeenCalledTimes(2);
    completeDrawerExit();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(originalOpener).toHaveFocus());
  });

  for (const dismissal of ["Close drawer", "Escape", "backdrop"] as const) {
    it(`restores card focus after ${dismissal} exit completes`, async () => {
      const user = userEvent.setup();
      render(<KanbanBoardPage />);
      const opener = screen.getByRole("button", {
        name: "Open Frontend Engineer at Acme",
      });

      await user.click(opener);
      if (dismissal === "Escape") {
        fireEvent.keyDown(document, { key: "Escape" });
      } else if (dismissal === "backdrop") {
        fireEvent.click(screen.getByTestId("drawer-backdrop"));
      } else {
        await user.click(screen.getByRole("button", { name: dismissal }));
      }

      expect(screen.getByLabelText("Company")).toHaveValue("Acme");
      expect(opener).not.toHaveFocus();
      completeDrawerExit();
      await waitFor(() => expect(opener).toHaveFocus());
    });
  }

  it("preserves the order index when saving in the same status", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);

    await user.click(
      screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledOnce());
    expect(updateMutateAsync.mock.calls[0]?.[0]).not.toHaveProperty(
      "order_index",
    );
  });

  it("requires delete confirmation before deleting the selected application", async () => {
    const user = userEvent.setup();
    const deferredDelete = createDeferredMutation();
    deleteMutateAsync.mockReturnValue(deferredDelete.promise);
    const { rerender } = render(<KanbanBoardPage />);
    const fallbackHeading = screen.getByRole("heading", {
      name: "Applications",
    });

    await user.click(
      screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteMutateAsync).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(deleteMutateAsync).toHaveBeenCalledWith("application-1");
    });

    useJobApplicationsMock.mockReturnValue({
      data: applications.slice(1),
      error: null,
      isError: false,
      isPending: false,
    });
    rerender(<KanbanBoardPage />);
    expect(
      screen.queryByRole("button", {
        name: "Open Frontend Engineer at Acme",
      }),
    ).not.toBeInTheDocument();

    await act(async () => {
      deferredDelete.resolve();
      await deferredDelete.promise;
    });

    expect(screen.getByLabelText("Company")).toHaveValue("Acme");
    expect(fallbackHeading).not.toHaveFocus();
    completeDrawerExit();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fallbackHeading).toHaveAttribute("tabindex", "-1");
    await waitFor(() => expect(fallbackHeading).toHaveFocus());
  });

  it("keeps the drawer visible and shows a save error after a rejected update", async () => {
    const user = userEvent.setup();
    updateMutateAsync.mockRejectedValue(new Error("save failed"));
    const { rerender } = render(<KanbanBoardPage />);

    await user.click(
      screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledOnce());
    useUpdateJobApplicationMock.mockReturnValue({
      isError: true,
      isPending: false,
      mutateAsync: updateMutateAsync,
      reset: updateReset,
    });
    rerender(<KanbanBoardPage />);

    expect(
      screen.getByText("The application could not be saved. Please try again."),
    ).toBeVisible();
    expect(
      screen.getByRole("dialog", { name: "Edit Frontend Engineer" }),
    ).toBeVisible();
  });

  it("provides the signed-in user with an account menu", () => {
    render(<KanbanBoardPage />);

    expect(
      screen.getByRole("heading", { name: "Applications" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Account menu" })).toBeVisible();
  });

  it("opens the requested application from the calendar deep link", async () => {
    search.applicationId = "application-2";

    render(<KanbanBoardPage />);

    expect(await screen.findByRole("dialog", { name: "Edit Product Engineer" })).toBeVisible();
    expect(screen.getByLabelText("Company")).toHaveValue("Globex");
  });

  it("opens the requested application after Strict Mode replays its effects", async () => {
    search.applicationId = "application-2";

    render(
      <StrictMode>
        <KanbanBoardPage />
      </StrictMode>,
    );

    expect(await screen.findByRole("dialog", { name: "Edit Product Engineer" })).toBeVisible();
  });

  it("shows allow-listed query error details during development", () => {
    useJobApplicationsMock.mockReturnValue({
      data: undefined,
      error: {
        authorization: "Bearer must-not-render",
        code: "PGRST301",
        message: "JWT verification failed",
        name: "PostgrestError",
      },
      isError: true,
      isPending: false,
    });

    render(<KanbanBoardPage />);

    expect(
      screen.getByText("Could not load applications. Please try again."),
    ).toBeVisible();
    expect(screen.getByText(/PostgrestError/)).toHaveTextContent("PGRST301");
    expect(screen.getByText(/PostgrestError/)).toHaveTextContent(
      "JWT verification failed",
    );
    expect(screen.queryByText(/must-not-render/)).not.toBeInTheDocument();
  });
});
