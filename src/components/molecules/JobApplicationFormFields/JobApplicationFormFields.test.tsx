import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JobApplicationFormFields } from "./JobApplicationFormFields";
import type { Resume } from "../../../types/database";
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
  resume_id: null,
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
];

function renderFields({
  disabled = false,
  errors = {},
  layout,
  showResumePicker = false,
}: {
  disabled?: boolean;
  errors?: JobApplicationFormErrors;
  layout?: "responsive" | "single-column";
  showResumePicker?: boolean;
} = {}) {
  const onChange = vi.fn();
  const setFieldRef = vi.fn();

  render(
    <JobApplicationFormFields
      disabled={disabled}
      errors={errors}
      idPrefix="test-application"
      layout={layout}
      resumes={resumes}
      showResumePicker={showResumePicker}
      values={values}
      onChange={onChange}
      setFieldRef={setFieldRef}
    />,
  );

  return { onChange, setFieldRef };
}

describe("JobApplicationFormFields", () => {
  it("keeps the default responsive two-column layout", () => {
    renderFields();

    expect(
      screen.getByRole("group", { name: "Application details" }),
    ).toHaveClass("md:grid-cols-2");
  });

  it("renders every detail field in one column when requested", () => {
    renderFields({ layout: "single-column" });
    const details = screen.getByRole("group", {
      name: "Application details",
    });

    expect(details).not.toHaveClass("md:grid-cols-2");
    expect(screen.getByLabelText("Job URL").parentElement).not.toHaveClass(
      "md:col-span-2",
    );
    expect(screen.getByLabelText("Notes").parentElement).not.toHaveClass(
      "md:col-span-2",
    );
    expect(screen.queryByLabelText("Resume version")).not.toBeInTheDocument();
  });

  it("groups every editable field as application details", () => {
    renderFields();

    const details = screen.getByRole("group", {
      name: "Application details",
    });

    for (const label of [
      "Company",
      "Position",
      "Job URL",
      "Status",
      "Applied date",
      "Notes",
    ]) {
      expect(within(details).getByLabelText(label)).toBeVisible();
    }
  });

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
    expect(screen.queryByLabelText("Resume version")).not.toBeInTheDocument();
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

  it("renders an optional resume picker with the current linked resume", () => {
    const { onChange } = renderFields({ showResumePicker: true });

    expect(screen.getByLabelText("Resume")).toHaveValue("");
    expect(screen.getByRole("option", { name: "No resume linked" })).toBeVisible();

    fireEvent.change(screen.getByLabelText("Resume"), {
      target: { value: "11111111-1111-4111-8111-111111111111" },
    });

    expect(onChange).toHaveBeenCalledWith(
      "resume_id",
      "11111111-1111-4111-8111-111111111111",
    );
  });
});
