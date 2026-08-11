import { describe, expect, it } from "vitest";
import type { JobApplication } from "../../../types/database";
import {
  emptyJobApplicationFormValues,
  issuesToFieldErrors,
  jobApplicationFormSchema,
  jobApplicationToFormValues,
} from "./jobApplicationFormSchema";

const validValues = {
  company: "Acme",
  position: "Frontend Engineer",
  job_url: "https://example.com/jobs/frontend-engineer",
  status: "saved",
  applied_date: "2024-02-29",
  notes: "Follow up next week",
  resume_version: "frontend-v2",
};

function fieldMessage(result: ReturnType<typeof jobApplicationFormSchema.safeParse>) {
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

describe("jobApplicationFormSchema", () => {
  it("provides an empty Saved draft for new applications", () => {
    expect(emptyJobApplicationFormValues).toEqual({
      company: "",
      position: "",
      job_url: "",
      status: "saved",
      applied_date: "",
      notes: "",
      resume_version: "",
    });
  });

  it.each([
    ["company", "", "Company is required."],
    ["company", "   ", "Company is required."],
    ["position", "", "Position is required."],
    ["position", "   ", "Position is required."],
  ] as const)("rejects a blank %s", (field, value, message) => {
    const result = jobApplicationFormSchema.safeParse({
      ...validValues,
      [field]: value,
    });

    expect(result.success).toBe(false);
    expect(fieldMessage(result)).toBe(message);
  });

  it("trims required values", () => {
    const result = jobApplicationFormSchema.safeParse({
      ...validValues,
      company: "  Acme  ",
      position: "  Frontend Engineer  ",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.company).toBe("Acme");
    expect(result.data.position).toBe("Frontend Engineer");
  });

  it.each(["", "   "])("normalizes an empty URL to null", (jobUrl) => {
    const result = jobApplicationFormSchema.safeParse({
      ...validValues,
      job_url: jobUrl,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.job_url).toBeNull();
  });

  it("trims a valid URL and rejects a malformed URL", () => {
    const validResult = jobApplicationFormSchema.safeParse({
      ...validValues,
      job_url: "  https://example.com/jobs/1  ",
    });
    const invalidResult = jobApplicationFormSchema.safeParse({
      ...validValues,
      job_url: "not a URL",
    });

    expect(validResult.success).toBe(true);
    if (validResult.success) {
      expect(validResult.data.job_url).toBe("https://example.com/jobs/1");
    }
    expect(invalidResult.success).toBe(false);
    expect(fieldMessage(invalidResult)).toBe("Enter a valid URL.");
  });

  it.each(["saved", "applied", "interview", "offer", "rejected"])(
    "accepts the %s status",
    (status) => {
      expect(
        jobApplicationFormSchema.safeParse({ ...validValues, status }).success,
      ).toBe(true);
    },
  );

  it("rejects an unsupported status", () => {
    const result = jobApplicationFormSchema.safeParse({
      ...validValues,
      status: "archived",
    });

    expect(result.success).toBe(false);
  });

  it.each([
    ["", null, true],
    ["2024-02-29", "2024-02-29", true],
    ["2024-2-9", undefined, false],
    ["2023-02-29", undefined, false],
    ["2026-04-31", undefined, false],
  ] as const)(
    "normalizes or validates applied date %s",
    (appliedDate, expectedValue, isValid) => {
      const result = jobApplicationFormSchema.safeParse({
        ...validValues,
        applied_date: appliedDate,
      });

      expect(result.success).toBe(isValid);
      if (result.success) {
        expect(result.data.applied_date).toBe(expectedValue);
      } else {
        expect(fieldMessage(result)).toBe("Enter a valid date.");
      }
    },
  );

  it("normalizes empty optional text and preserves non-empty notes", () => {
    const emptyResult = jobApplicationFormSchema.safeParse({
      ...validValues,
      job_url: " ",
      applied_date: "",
      notes: "   ",
      resume_version: "   ",
    });
    const populatedResult = jobApplicationFormSchema.safeParse({
      ...validValues,
      notes: "  Keep this spacing  ",
      resume_version: "  v4  ",
    });

    expect(emptyResult.success).toBe(true);
    if (emptyResult.success) {
      expect(emptyResult.data).toMatchObject({
        job_url: null,
        applied_date: null,
        notes: null,
        resume_version: null,
      });
    }
    expect(populatedResult.success).toBe(true);
    if (populatedResult.success) {
      expect(populatedResult.data.notes).toBe("  Keep this spacing  ");
      expect(populatedResult.data.resume_version).toBe("v4");
    }
  });

  it("converts nullable application fields into raw editable strings", () => {
    const application: JobApplication = {
      id: "application-1",
      user_id: "user-1",
      company: "Acme",
      position: "Engineer",
      job_url: null,
      status: "interview",
      applied_date: null,
      notes: null,
      resume_version: null,
      order_index: 1_000,
      created_at: "2026-08-11T00:00:00.000Z",
      updated_at: "2026-08-11T00:00:00.000Z",
    };

    expect(jobApplicationToFormValues(application)).toEqual({
      company: "Acme",
      position: "Engineer",
      job_url: "",
      status: "interview",
      applied_date: "",
      notes: "",
      resume_version: "",
    });
  });

  it("keeps only the first issue for each recognized field", () => {
    const result = jobApplicationFormSchema.safeParse({
      ...validValues,
      company: "",
      position: "",
      job_url: "invalid",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(issuesToFieldErrors(result.error.issues)).toEqual({
      company: "Company is required.",
      position: "Position is required.",
      job_url: "Enter a valid URL.",
    });
  });
});
