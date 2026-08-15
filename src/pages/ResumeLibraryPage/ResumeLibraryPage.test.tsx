import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeLibraryPage } from "./ResumeLibraryPage";

vi.mock("@clerk/clerk-react", () => ({ UserButton: () => <div>User</div> }));
vi.mock("../../hooks/useJobApplications", () => ({
  useJobApplications: () => ({ data: [], isPending: false }),
  useCreateJobApplication: () => ({ isError: false, isPending: false, mutateAsync: vi.fn(), reset: vi.fn() }),
}));
vi.mock("../../hooks/useResumes", () => ({
  ACCEPTED_RESUME_FILE_TYPES: new Set(["application/pdf"]),
  MAX_RESUME_FILE_SIZE: 10 * 1024 * 1024,
  useDeleteResume: () => ({ isError: false, isPending: false, mutateAsync: vi.fn() }),
  useResumes: () => ({ data: [], isError: false, isPending: false }),
  useUploadResume: () => ({ isError: false, isPending: false, mutateAsync: vi.fn() }),
}));

describe("ResumeLibraryPage", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }));
  });

  it("renders the resume library with an active Resumes destination", () => {
    render(<ResumeLibraryPage />);

    expect(screen.getByRole("heading", { name: "Resumes" })).toBeVisible();
    expect(
      screen
        .getAllByRole("link", { name: "Resumes" })
        .some((link) => link.getAttribute("aria-current") === "page"),
    ).toBe(true);
  });
});
