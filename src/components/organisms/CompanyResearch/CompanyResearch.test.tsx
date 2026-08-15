import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyResearch } from "./CompanyResearch";

const {
  deleteResearchMutateAsync,
  upsertResearchMutateAsync,
  useCompanyResearchMock,
  useCreateInterviewerMock,
  useDeleteCompanyResearchMock,
  useDeleteInterviewerMock,
  useInterviewersMock,
  useUpsertCompanyResearchMock,
  useUpdateInterviewerMock,
} = vi.hoisted(() => ({
  deleteResearchMutateAsync: vi.fn(),
  upsertResearchMutateAsync: vi.fn(),
  useCompanyResearchMock: vi.fn(),
  useCreateInterviewerMock: vi.fn(),
  useDeleteCompanyResearchMock: vi.fn(),
  useDeleteInterviewerMock: vi.fn(),
  useInterviewersMock: vi.fn(),
  useUpsertCompanyResearchMock: vi.fn(),
  useUpdateInterviewerMock: vi.fn(),
}));

vi.mock("../../../hooks/useCompanyResearch", () => ({
  useCompanyResearch: useCompanyResearchMock,
  useCreateInterviewer: useCreateInterviewerMock,
  useDeleteCompanyResearch: useDeleteCompanyResearchMock,
  useDeleteInterviewer: useDeleteInterviewerMock,
  useInterviewers: useInterviewersMock,
  useUpsertCompanyResearch: useUpsertCompanyResearchMock,
  useUpdateInterviewer: useUpdateInterviewerMock,
}));

describe("CompanyResearch", () => {
  beforeEach(() => {
    upsertResearchMutateAsync.mockReset().mockResolvedValue(undefined);
    deleteResearchMutateAsync.mockReset().mockResolvedValue(undefined);
    useCompanyResearchMock.mockReturnValue({ data: null, isError: false, isPending: false });
    useInterviewersMock.mockReturnValue({ data: [], isError: false, isPending: false });
    useUpsertCompanyResearchMock.mockReturnValue({ isError: false, isPending: false, mutateAsync: upsertResearchMutateAsync });
    useCreateInterviewerMock.mockReturnValue({ isError: false, isPending: false, mutateAsync: vi.fn() });
    useDeleteCompanyResearchMock.mockReturnValue({ isError: false, isPending: false, mutateAsync: deleteResearchMutateAsync });
    useDeleteInterviewerMock.mockReturnValue({ isError: false, isPending: false, mutateAsync: vi.fn() });
    useUpdateInterviewerMock.mockReturnValue({ isError: false, isPending: false, mutateAsync: vi.fn() });
  });

  it("starts collapsed when the application has no research", () => {
    render(<CompanyResearch jobApplicationId="application-1" />);

    expect(screen.getByRole("button", { name: "Company Research" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByLabelText("Culture notes")).not.toBeInTheDocument();
  });

  it("expands the section and independently saves normalized research", async () => {
    const user = userEvent.setup();
    useCompanyResearchMock.mockReturnValue({
      data: {
        id: "research-1",
        user_id: "user-1",
        job_application_id: "application-1",
        culture_notes: "Existing notes",
        salary_min: 70000,
        salary_max: 85000,
        salary_currency: "EUR",
        salary_source: "Levels.fyi",
        created_at: "2026-08-14T00:00:00.000Z",
        updated_at: "2026-08-14T00:00:00.000Z",
      },
      isError: false,
      isPending: false,
    });
    render(<CompanyResearch jobApplicationId="application-1" />);

    expect(screen.getByRole("button", { name: "Company Research" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const notes = screen.getByLabelText("Culture notes");
    await user.clear(notes);
    await user.type(notes, "  New culture notes  ");
    await user.click(screen.getByRole("button", { name: "Save research" }));

    await waitFor(() => expect(upsertResearchMutateAsync).toHaveBeenCalledWith({
      job_application_id: "application-1",
      culture_notes: "New culture notes",
      salary_min: 70000,
      salary_max: 85000,
      salary_currency: "EUR",
      salary_source: "Levels.fyi",
    }));
  });

  it("shows query errors without blocking the drawer section", () => {
    useCompanyResearchMock.mockReturnValue({ data: null, isError: true, isPending: false });
    render(<CompanyResearch jobApplicationId="application-1" />);

    expect(screen.getByText("Could not load company research. Please try again.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Company Research" })).toBeVisible();
  });
});
