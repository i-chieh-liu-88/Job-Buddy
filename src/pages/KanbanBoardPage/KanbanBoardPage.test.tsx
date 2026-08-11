import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobApplication } from "../../types/database";
import { KanbanBoardPage } from "./KanbanBoardPage";

const {
  deleteMutateAsync,
  deleteReset,
  updateMutateAsync,
  updateReset,
  useDeleteJobApplicationMock,
  useJobApplicationsMock,
  useUpdateJobApplicationMock,
} = vi.hoisted(() => ({
  deleteMutateAsync: vi.fn(),
  deleteReset: vi.fn(),
  updateMutateAsync: vi.fn(),
  updateReset: vi.fn(),
  useDeleteJobApplicationMock: vi.fn(),
  useJobApplicationsMock: vi.fn(),
  useUpdateJobApplicationMock: vi.fn(),
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
    applied_date: null,
    notes: null,
    resume_version: null,
    order_index: 2_000,
    created_at: "2026-08-11T00:00:00.000Z",
    updated_at: "2026-08-11T00:00:00.000Z",
  },
];

vi.mock("@clerk/clerk-react", () => ({
  UserButton: () => <button type="button" aria-label="Account menu" />,
}));

vi.mock("../../hooks/useJobApplications", () => ({
  useDeleteJobApplication: useDeleteJobApplicationMock,
  useJobApplications: useJobApplicationsMock,
  useReorderJobApplications: () => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  }),
  useUpdateJobApplication: useUpdateJobApplicationMock,
}));

describe("KanbanBoardPage", () => {
  beforeEach(() => {
    deleteMutateAsync.mockReset();
    deleteMutateAsync.mockResolvedValue(undefined);
    deleteReset.mockReset();
    updateMutateAsync.mockReset();
    updateMutateAsync.mockResolvedValue(undefined);
    updateReset.mockReset();

    useJobApplicationsMock.mockReturnValue({
      data: applications,
      error: null,
      isError: false,
      isPending: false,
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

  it("appends a moved application after destination cards before saving", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);

    await user.click(
      screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
    );

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
        resume_version: null,
        order_index: 3_000,
      });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets mutations and closes without saving or deleting when cancelled", async () => {
    const user = userEvent.setup();
    render(<KanbanBoardPage />);

    await user.click(
      screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
    );

    expect(updateReset).toHaveBeenCalledOnce();
    expect(deleteReset).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(updateMutateAsync).not.toHaveBeenCalled();
    expect(deleteMutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(updateReset).toHaveBeenCalledTimes(2);
    expect(deleteReset).toHaveBeenCalledTimes(2);
  });

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
    render(<KanbanBoardPage />);

    await user.click(
      screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteMutateAsync).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(deleteMutateAsync).toHaveBeenCalledWith("application-1");
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog visible and shows a save error after a rejected update", async () => {
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
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("provides the signed-in user with an account menu", () => {
    render(<KanbanBoardPage />);

    expect(
      screen.getByRole("heading", { name: "Applications" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Account menu" })).toBeVisible();
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
