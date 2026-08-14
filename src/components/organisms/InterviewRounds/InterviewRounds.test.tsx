import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InterviewRounds } from "./InterviewRounds";

const {
  createMutateAsync,
  deleteMutateAsync,
  updateMutateAsync,
  useCreateInterviewMock,
  useDeleteInterviewMock,
  useInterviewsForApplicationMock,
  useUpdateInterviewMock,
} = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  deleteMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  useCreateInterviewMock: vi.fn(),
  useDeleteInterviewMock: vi.fn(),
  useInterviewsForApplicationMock: vi.fn(),
  useUpdateInterviewMock: vi.fn(),
}));

vi.mock("../../../hooks/useInterviews", () => ({
  useCreateInterview: useCreateInterviewMock,
  useDeleteInterview: useDeleteInterviewMock,
  useInterviewsForApplication: useInterviewsForApplicationMock,
  useUpdateInterview: useUpdateInterviewMock,
}));

const interviews = [{
  id: "interview-1", user_id: "user-1", job_application_id: "application-1",
  round_label: "Phone screen", scheduled_at: "2026-08-20T09:30:00.000Z",
  location_or_link: "https://meet.example/phone", notes: "Ask about team", created_at: "2026-08-13T00:00:00.000Z",
}];

describe("InterviewRounds", () => {
  beforeEach(() => {
    createMutateAsync.mockReset().mockResolvedValue(undefined);
    deleteMutateAsync.mockReset().mockResolvedValue(undefined);
    updateMutateAsync.mockReset().mockResolvedValue(undefined);
    useInterviewsForApplicationMock.mockReturnValue({ data: interviews, isError: false, isPending: false });
    useCreateInterviewMock.mockReturnValue({ isError: false, isPending: false, mutateAsync: createMutateAsync });
    useDeleteInterviewMock.mockReturnValue({ isError: false, isPending: false, mutateAsync: deleteMutateAsync });
    useUpdateInterviewMock.mockReturnValue({ isError: false, isPending: false, mutateAsync: updateMutateAsync });
  });

  it("creates a round from a local datetime without affecting other records", async () => {
    const user = userEvent.setup();
    render(<InterviewRounds jobApplicationId="application-1" />);
    await user.click(screen.getByRole("button", { name: "Add interview round" }));
    await user.type(screen.getByLabelText("Round label"), "Technical");
    await user.type(screen.getByLabelText("Date and time"), "2026-08-20T11:30");
    await user.click(screen.getByRole("button", { name: "Save interview round" }));

    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledWith({
      job_application_id: "application-1", round_label: "Technical",
      scheduled_at: new Date("2026-08-20T11:30").toISOString(),
      location_or_link: null, notes: null,
    }));
  });

  it("saves a round without submitting a parent application form", async () => {
    const user = userEvent.setup();
    const onApplicationSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onApplicationSubmit}>
        <InterviewRounds jobApplicationId="application-1" />
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Add interview round" }));
    await user.type(screen.getByLabelText("Round label"), "Technical");
    await user.type(screen.getByLabelText("Date and time"), "2026-08-20T11:30");
    await user.click(screen.getByRole("button", { name: "Save interview round" }));

    await waitFor(() => expect(createMutateAsync).toHaveBeenCalledTimes(1));
    expect(onApplicationSubmit).not.toHaveBeenCalled();
  });

  it("requires confirmation before deleting a round", async () => {
    const user = userEvent.setup();
    render(<InterviewRounds jobApplicationId="application-1" />);
    await user.click(screen.getByRole("button", { name: "Delete Phone screen" }));
    expect(deleteMutateAsync).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm delete Phone screen" }));
    await waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledWith({ id: "interview-1", jobApplicationId: "application-1" }));
  });
});
