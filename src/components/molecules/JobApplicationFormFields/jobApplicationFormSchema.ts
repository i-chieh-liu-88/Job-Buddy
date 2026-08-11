import { z } from "zod";
import type { JobApplication } from "../../../types/database";

export const jobApplicationStatuses = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

const formFieldNames = [
  "company",
  "position",
  "job_url",
  "status",
  "applied_date",
  "notes",
  "resume_version",
] as const;

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isRealIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

export const jobApplicationFormSchema = z.object({
  company: z.string().trim().min(1, "Company is required."),
  position: z.string().trim().min(1, "Position is required."),
  job_url: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value === "" || isValidUrl(value), {
      message: "Enter a valid URL.",
    })
    .transform((value) => (value === "" ? null : value)),
  status: z.enum(jobApplicationStatuses),
  applied_date: z
    .string()
    .refine((value) => value === "" || isRealIsoDate(value), {
      message: "Enter a valid date.",
    })
    .transform((value) => (value === "" ? null : value)),
  notes: z
    .string()
    .transform((value) => (value.trim() === "" ? null : value)),
  resume_version: z
    .string()
    .transform((value) => value.trim())
    .transform((value) => (value === "" ? null : value)),
});

export type JobApplicationFormValues = z.input<
  typeof jobApplicationFormSchema
>;
export type JobApplicationFormData = z.output<
  typeof jobApplicationFormSchema
>;
export type JobApplicationFormField = keyof JobApplicationFormValues;
export type JobApplicationFormErrors = Partial<
  Record<JobApplicationFormField, string>
>;

export const emptyJobApplicationFormValues: JobApplicationFormValues = {
  company: "",
  position: "",
  job_url: "",
  status: "saved",
  applied_date: "",
  notes: "",
  resume_version: "",
};

export function jobApplicationToFormValues(
  application: JobApplication,
): JobApplicationFormValues {
  return {
    company: application.company,
    position: application.position,
    job_url: application.job_url ?? "",
    status: application.status,
    applied_date: application.applied_date ?? "",
    notes: application.notes ?? "",
    resume_version: application.resume_version ?? "",
  };
}

type FormValidationIssue = {
  message: string;
  path: PropertyKey[];
};

export function issuesToFieldErrors(
  issues: readonly FormValidationIssue[],
): JobApplicationFormErrors {
  const errors: JobApplicationFormErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      formFieldNames.includes(field as JobApplicationFormField) &&
      errors[field as JobApplicationFormField] === undefined
    ) {
      errors[field as JobApplicationFormField] = issue.message;
    }
  }

  return errors;
}
