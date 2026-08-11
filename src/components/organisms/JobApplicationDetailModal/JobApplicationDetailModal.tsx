import { useEffect, useRef, useState } from "react";
import type { FormEvent, InvalidEvent } from "react";
import type { UpdateJobApplicationInput } from "../../../hooks/useJobApplications";
import type { JobApplication, JobApplicationStatus } from "../../../types/database";

type JobApplicationDetailModalProps = {
  application: JobApplication;
  hasDeleteError: boolean;
  hasSaveError: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<unknown>;
  onSave: (input: UpdateJobApplicationInput) => Promise<unknown>;
};

const statusOptions: ReadonlyArray<JobApplicationStatus> = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];

function nullableTrimmedValue(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

function nullableNotesValue(value: string) {
  return value.trim() === "" ? null : value;
}

export function JobApplicationDetailModal({
  application,
  hasDeleteError,
  hasSaveError,
  isDeleting,
  isSaving,
  onClose,
  onDelete,
  onSave,
}: JobApplicationDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [company, setCompany] = useState(application.company);
  const [position, setPosition] = useState(application.position);
  const [jobUrl, setJobUrl] = useState(application.job_url ?? "");
  const [status, setStatus] = useState<JobApplicationStatus>(application.status);
  const [appliedDate, setAppliedDate] = useState(application.applied_date ?? "");
  const [notes, setNotes] = useState(application.notes ?? "");
  const [resumeVersion, setResumeVersion] = useState(
    application.resume_version ?? "",
  );
  const [fieldErrors, setFieldErrors] = useState<{
    company?: string;
    position?: string;
  }>({});
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const isBusy = isSaving || isDeleting;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
    if (event.currentTarget.name === "company") {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        company: "Company is required.",
      }));
    }

    if (event.currentTarget.name === "position") {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        position: "Position is required.",
      }));
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCompany = company.trim();
    const trimmedPosition = position.trim();
    const requiredFieldErrors = {
      company:
        trimmedCompany === "" ? "Company is required." : undefined,
      position:
        trimmedPosition === "" ? "Position is required." : undefined,
    };

    if (requiredFieldErrors.company || requiredFieldErrors.position) {
      setFieldErrors(requiredFieldErrors);
      return;
    }

    if (!event.currentTarget.checkValidity()) return;

    try {
      await onSave({
        id: application.id,
        company: trimmedCompany,
        position: trimmedPosition,
        job_url: nullableTrimmedValue(jobUrl),
        status,
        applied_date: nullableTrimmedValue(appliedDate),
        notes: nullableNotesValue(notes),
        resume_version: nullableTrimmedValue(resumeVersion),
      });
      closeDialog();
    } catch {
      // The parent rerenders the error state after its mutation rejects.
    }
  }

  async function handleDelete() {
    try {
      await onDelete(application.id);
      closeDialog();
    } catch {
      // The parent rerenders the error state after its mutation rejects.
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-describedby="application-detail-description"
      aria-labelledby="application-detail-title"
      className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl"
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) closeDialog();
      }}
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h2 id="application-detail-title" className="text-xl font-semibold">
            Edit {application.position}
          </h2>
          <p
            id="application-detail-description"
            className="mt-1 text-sm text-slate-600"
          >
            Update the details for this job application.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          disabled={isBusy}
          onClick={closeDialog}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <form className="space-y-4 px-6 py-5" onSubmit={handleSave}>
        <label className="block text-sm font-medium" htmlFor="application-company">
          Company
        </label>
        <input
          autoFocus
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          disabled={isBusy}
          id="application-company"
          name="company"
          required
          value={company}
          onChange={(event) => {
            setCompany(event.target.value);
            setFieldErrors((currentErrors) => ({
              ...currentErrors,
              company: undefined,
            }));
          }}
          onInvalid={handleInvalid}
        />
        {fieldErrors.company ? <p role="alert">{fieldErrors.company}</p> : null}
        <label className="block text-sm font-medium" htmlFor="application-position">
          Position
        </label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          disabled={isBusy}
          id="application-position"
          name="position"
          required
          value={position}
          onChange={(event) => {
            setPosition(event.target.value);
            setFieldErrors((currentErrors) => ({
              ...currentErrors,
              position: undefined,
            }));
          }}
          onInvalid={handleInvalid}
        />
        {fieldErrors.position ? <p role="alert">{fieldErrors.position}</p> : null}
        <label className="block text-sm font-medium" htmlFor="application-job-url">
          Job URL
        </label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          disabled={isBusy}
          id="application-job-url"
          type="url"
          value={jobUrl}
          onChange={(event) => setJobUrl(event.target.value)}
        />
        <label className="block text-sm font-medium" htmlFor="application-status">
          Status
        </label>
        <select
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          disabled={isBusy}
          id="application-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as JobApplicationStatus)}
        >
          {statusOptions.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusOption}
            </option>
          ))}
        </select>
        <label
          className="block text-sm font-medium"
          htmlFor="application-applied-date"
        >
          Applied date
        </label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          disabled={isBusy}
          id="application-applied-date"
          type="date"
          value={appliedDate}
          onChange={(event) => setAppliedDate(event.target.value)}
        />
        <label className="block text-sm font-medium" htmlFor="application-notes">
          Notes
        </label>
        <textarea
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          disabled={isBusy}
          id="application-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <label
          className="block text-sm font-medium"
          htmlFor="application-resume-version"
        >
          Resume version
        </label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          disabled={isBusy}
          id="application-resume-version"
          value={resumeVersion}
          onChange={(event) => setResumeVersion(event.target.value)}
        />
        {hasSaveError ? (
          <p role="alert">The application could not be saved. Please try again.</p>
        ) : null}
        {hasDeleteError ? (
          <p role="alert">The application could not be deleted. Please try again.</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          {isDeleteConfirmationVisible ? (
            <div className="flex flex-wrap items-center gap-2">
              <p>Delete {application.company}?</p>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setIsDeleteConfirmationVisible(false)}
              >
                Cancel delete
              </button>
              <button type="button" disabled={isBusy} onClick={handleDelete}>
                Confirm delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setIsDeleteConfirmationVisible(true)}
            >
              Delete
            </button>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={isBusy} onClick={closeDialog}>
              Cancel
            </button>
            <button type="submit" disabled={isBusy}>
              Save changes
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
