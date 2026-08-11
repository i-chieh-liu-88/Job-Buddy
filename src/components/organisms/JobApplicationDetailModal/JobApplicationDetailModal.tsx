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
      <form className="space-y-4 px-6 py-5" noValidate onSubmit={handleSave}>
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
          <p role="alert">The application could not be saved. Please try again.</p>
        ) : null}
        {hasDeleteError ? (
          <p role="alert">The application could not be deleted. Please try again.</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          {isDeleteConfirmationVisible ? (
            <div className="flex flex-wrap items-center gap-2">
              <p role="alert">Delete {application.company}?</p>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setIsDeleteConfirmationVisible(false)}
              >
                Cancel delete
              </button>
              <button
                ref={confirmDeleteButtonRef}
                type="button"
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
