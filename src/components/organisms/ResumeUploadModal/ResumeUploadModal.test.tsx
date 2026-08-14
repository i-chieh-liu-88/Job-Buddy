import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResumeUploadModal } from "./ResumeUploadModal";

describe("ResumeUploadModal", () => {
  it("requires a label and a supported file before upload", async () => {
    const user = userEvent.setup();
    render(
      <ResumeUploadModal
        hasUploadError={false}
        isUploading={false}
        onClose={vi.fn()}
        onUpload={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Upload resume" }));

    expect(screen.getByText("A resume label is required.")).toBeVisible();
    expect(screen.getByText("Choose a PDF, DOC, or DOCX file.")).toBeVisible();
  });
});
