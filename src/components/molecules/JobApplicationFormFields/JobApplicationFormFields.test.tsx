import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JobApplicationFormFields } from "./JobApplicationFormFields";
import type {
  JobApplicationFormErrors,
  JobApplicationFormValues,
} from "./jobApplicationFormSchema";

const values: JobApplicationFormValues = {
  company: "Acme",
  position: "Frontend Engineer",
  job_url: "https://example.com/jobs/1",
  status: "interview",
  applied_date: "2026-08-10",
  notes: "Follow up",
  resume_version: "frontend-v2",
};

function renderFields({
  disabled = false,
  errors = {},
}: {
  disabled?: boolean;
  errors?: JobApplicationFormErrors;
} = {}) {
  const onChange = vi.fn();
  const setFieldRef = vi.fn();

  render(
    <JobApplicationFormFields
      disabled={disabled}
      errors={errors}
      idPrefix="test-application"
      values={values}
      onChange={onChange}
      setFieldRef={setFieldRef}
    />,
  );

  return { onChange, setFieldRef };
}

describe("JobApplicationFormFields", () => {
  it("renders all editable values and the five supported statuses", () => {
    renderFields();

    expect(screen.getByLabelText("Company")).toHaveValue("Acme");
    expect(screen.getByLabelText("Position")).toHaveValue(
      "Frontend Engineer",
    );
    expect(screen.getByLabelText("Job URL")).toHaveValue(
      "https://example.com/jobs/1",
    );
    expect(screen.getByLabelText("Status")).toHaveValue("interview");
    expect(screen.getByLabelText("Applied date")).toHaveValue("2026-08-10");
    expect(screen.getByLabelText("Notes")).toHaveValue("Follow up");
    expect(screen.getByLabelText("Resume version")).toHaveValue(
      "frontend-v2",
    );
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Saved", "Applied", "Interview", "Offer", "Rejected"]);
  });

  it("disables every editable control", () => {
    renderFields({ disabled: true });

    for (const label of [
      "Company",
      "Position",
      "Job URL",
      "Status",
      "Applied date",
      "Notes",
      "Resume version",
    ]) {
      expect(screen.getByLabelText(label)).toBeDisabled();
    }
  });

  it("associates company and applied date errors with their controls", () => {
    renderFields({
      errors: {
        company: "Company is required.",
        applied_date: "Enter a valid date.",
      },
    });

    const company = screen.getByLabelText("Company");
    const appliedDate = screen.getByLabelText("Applied date");

    expect(company).toHaveAttribute("aria-invalid", "true");
    expect(company).toHaveAttribute(
      "aria-describedby",
      "test-application-company-error",
    );
    expect(screen.getByText("Company is required.")).toHaveAttribute(
      "id",
      "test-application-company-error",
    );
    expect(appliedDate).toHaveAttribute("aria-invalid", "true");
    expect(appliedDate).toHaveAttribute(
      "aria-describedby",
      "test-application-applied-date-error",
    );
    expect(screen.getByText("Enter a valid date.")).toHaveAttribute(
      "id",
      "test-application-applied-date-error",
    );
  });

  it("reports field changes and exposes the rendered controls", () => {
    const { onChange, setFieldRef } = renderFields();

    fireEvent.change(screen.getByLabelText("Notes"), {
      target: { value: "Updated notes" },
    });

    expect(onChange).toHaveBeenCalledWith("notes", "Updated notes");
    expect(setFieldRef).toHaveBeenCalledWith(
      "company",
      screen.getByLabelText("Company"),
    );
    expect(setFieldRef).toHaveBeenCalledWith(
      "notes",
      screen.getByLabelText("Notes"),
    );
  });
});
