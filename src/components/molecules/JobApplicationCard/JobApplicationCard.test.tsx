import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { JobApplication } from "../../../types/database";
import { JobApplicationCardPreview } from "./JobApplicationCard";

const application: JobApplication = {
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
};

describe("JobApplicationCardPreview", () => {
  it("renders drag feedback without an interactive sortable role", () => {
    render(<JobApplicationCardPreview application={application} />);

    expect(
      screen.getByLabelText("Frontend Engineer at Acme"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
