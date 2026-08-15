import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Resume } from "../../../types/database";
import { ResumeLibrary } from "./ResumeLibrary";

const resume: Resume = {
  id: "resume-1",
  user_id: "user-1",
  label: "Frontend v2",
  file_path: "user-1/resume-1/frontend-v2.pdf",
  file_type: "application/pdf",
  file_size: 2_500_000,
  uploaded_at: "2026-08-13T12:00:00.000Z",
};

describe("ResumeLibrary", () => {
  it("shows the empty state and opens the upload form", async () => {
    const user = userEvent.setup();
    render(
      <ResumeLibrary
        hasDeleteError={false}
        hasUploadError={false}
        isDeleting={false}
        isUploading={false}
        resumes={[]}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onUpload={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole("button", { name: "Drop your resume here or browse files" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Upload resume" }));
    expect(screen.getByRole("dialog", { name: "Upload resume" })).toBeVisible();
  });

  it("shows metadata and requires confirmation before deleting", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <ResumeLibrary
        hasDeleteError={false}
        hasUploadError={false}
        isDeleting={false}
        isUploading={false}
        resumes={[resume]}
        onDelete={onDelete}
        onUpload={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText("Frontend v2")).toBeVisible();
    expect(screen.getByText(/PDF · 2.4 MB · Uploaded/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Delete Frontend v2" }));
    expect(screen.getByText("Remove Frontend v2?")).toBeVisible();
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(onDelete).toHaveBeenCalledWith(resume);
  });
});
