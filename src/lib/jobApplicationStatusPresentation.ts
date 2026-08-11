import type { JobApplicationStatus } from "../types/database";

export type JobApplicationStatusPresentation = {
  label: string;
  indicatorClassName: string;
};

export const JOB_APPLICATION_STATUS_ORDER = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const satisfies readonly JobApplicationStatus[];

export const JOB_APPLICATION_STATUS_PRESENTATION = {
  saved: { label: "Saved", indicatorClassName: "bg-status-saved" },
  applied: { label: "Applied", indicatorClassName: "bg-status-applied" },
  interview: {
    label: "Interview",
    indicatorClassName: "bg-status-interview",
  },
  offer: { label: "Offer", indicatorClassName: "bg-status-offer" },
  rejected: { label: "Rejected", indicatorClassName: "bg-status-rejected" },
} as const satisfies Readonly<
  Record<JobApplicationStatus, JobApplicationStatusPresentation>
>;
