import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { JobApplicationFormFields } from "../../molecules/JobApplicationFormFields/JobApplicationFormFields";
import type { JobApplicationFormControl } from "../../molecules/JobApplicationFormFields/JobApplicationFormFields";
import {
  issuesToFieldErrors,
  jobApplicationFormSchema,
  jobApplicationToFormValues,
} from "../../molecules/JobApplicationFormFields/jobApplicationFormSchema";
import type {
  JobApplicationFormErrors,
  JobApplicationFormField,
  JobApplicationFormValues,
} from "../../molecules/JobApplicationFormFields/jobApplicationFormSchema";
import type { UpdateJobApplicationInput } from "../../../hooks/useJobApplications";
import type { JobApplication } from "../../../types/database";

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

const fieldOrder: JobApplicationFormField[] = [
  "company",
  "position",
  "job_url",
  "status",
  "applied_date",
  "notes",
  "resume_version",
];

const buttonClassName =
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

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
  const fieldRefs = useRef<
    Partial<Record<JobApplicationFormField, JobApplicationFormControl>>
  >({});
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const confirmDeleteButtonRef = useRef<HTMLButtonElement>(null);
  const hasOpenedDeleteConfirmationRef = useRef(false);
  const [values, setValues] = useState<JobApplicationFormValues>(() =>
    jobApplicationToFormValues(application),
  );
  const [fieldErrors, setFieldErrors] =
    useState<JobApplicationFormErrors>({});
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const isBusy = isSaving || isDeleting;

  useEffect(() => {
    dialogRef.current?.showModal();
    fieldRefs.current.company?.focus();
  }, []);

  useEffect(() => {
    if (isDeleteConfirmationVisible) {
      hasOpenedDeleteConfirmationRef.current = true;
      confirmDeleteButtonRef.current?.focus();
      return;
    }

    if (hasOpenedDeleteConfirmationRef.current) {
      deleteButtonRef.current?.focus();
    }
  }, [isDeleteConfirmationVisible]);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleFieldChange(field: JobApplicationFormField, value: string) {
    setValues(
      (currentValues) =>
        ({ ...currentValues, [field]: value }) as JobApplicationFormValues,
    );
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = jobApplicationFormSchema.safeParse(values);
    if (!result.success) {
      const errors = issuesToFieldErrors(result.error.issues);
      setFieldErrors(errors);
      const firstInvalidField = fieldOrder.find((field) => errors[field]);
      if (firstInvalidField) fieldRefs.current[firstInvalidField]?.focus();
      return;
    }

    try {
      await onSave({ id: application.id, ...result.data });
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
      className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl overflow-hidden rounded-xl border border-line bg-canvas p-0 text-ink shadow-[0_24px_64px_rgba(30,31,33,0.18)] backdrop:bg-ink/30 backdrop:backdrop-blur-[1px] open:flex open:flex-col"
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) closeDialog();
      }}
      onClose={onClose}
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-6 md:py-5">
        <div>
          <h2
            id="application-detail-title"
            className="text-xl font-semibold tracking-[-0.01em] text-ink"
          >
            Edit {application.position}
          </h2>
          <p
            id="application-detail-description"
            className="mt-1 text-sm text-muted"
          >
            Update the details for this job application.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-xl leading-none text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          disabled={isBusy}
          onClick={closeDialog}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <form
        className="flex min-h-0 flex-1 flex-col"
        noValidate
        onSubmit={handleSave}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <JobApplicationFormFields
            disabled={isBusy}
            errors={fieldErrors}
            idPrefix="application"
            values={values}
            onChange={handleFieldChange}
            setFieldRef={(field, element) => {
              if (element) fieldRefs.current[field] = element;
            }}
          />
          {hasSaveError ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              The application could not be saved. Please try again.
            </p>
          ) : null}
          {hasDeleteError ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              The application could not be deleted. Please try again.
            </p>
          ) : null}
        </div>
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-5 py-4 md:px-6"
          role={isDeleteConfirmationVisible ? undefined : "group"}
          aria-label={
            isDeleteConfirmationVisible ? undefined : "Application actions"
          }
        >
          {isDeleteConfirmationVisible ? (
            <div
              className="flex flex-1 flex-wrap items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-2.5"
              role="group"
              aria-label="Delete confirmation"
            >
              <p className="mr-auto text-sm font-medium text-danger" role="alert">
                Delete {application.company}?
              </p>
              <button
                type="button"
                className={`${buttonClassName} border border-line bg-canvas text-ink hover:bg-hover`}
                disabled={isBusy}
                onClick={() => setIsDeleteConfirmationVisible(false)}
              >
                Cancel delete
              </button>
              <button
                ref={confirmDeleteButtonRef}
                type="button"
                className={`${buttonClassName} bg-danger text-white hover:bg-danger/90`}
                disabled={isBusy}
                onClick={handleDelete}
              >
                Confirm delete
              </button>
            </div>
          ) : (
            <button
              ref={deleteButtonRef}
              type="button"
              className={`${buttonClassName} border border-danger/40 bg-canvas text-danger hover:bg-danger/5`}
              disabled={isBusy}
              onClick={() => setIsDeleteConfirmationVisible(true)}
            >
              Delete
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className={`${buttonClassName} border border-line bg-canvas text-ink hover:bg-hover`}
              disabled={isBusy}
              onClick={closeDialog}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${buttonClassName} bg-primary text-ink hover:bg-primary-hover`}
              disabled={isBusy}
            >
              Save changes
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
