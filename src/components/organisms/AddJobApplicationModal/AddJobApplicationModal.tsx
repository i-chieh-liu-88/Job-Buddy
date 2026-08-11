import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { JobApplicationFormFields } from "../../molecules/JobApplicationFormFields/JobApplicationFormFields";
import type { JobApplicationFormControl } from "../../molecules/JobApplicationFormFields/JobApplicationFormFields";
import {
  emptyJobApplicationFormValues,
  issuesToFieldErrors,
  jobApplicationFormSchema,
} from "../../molecules/JobApplicationFormFields/jobApplicationFormSchema";
import type {
  JobApplicationFormData,
  JobApplicationFormErrors,
  JobApplicationFormField,
  JobApplicationFormValues,
} from "../../molecules/JobApplicationFormFields/jobApplicationFormSchema";

type AddJobApplicationModalProps = {
  hasCreateError: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (input: JobApplicationFormData) => Promise<unknown>;
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

export function AddJobApplicationModal({
  hasCreateError,
  isCreating,
  onClose,
  onCreate,
}: AddJobApplicationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldRefs = useRef<
    Partial<Record<JobApplicationFormField, JobApplicationFormControl>>
  >({});
  const [values, setValues] = useState<JobApplicationFormValues>(
    emptyJobApplicationFormValues,
  );
  const [fieldErrors, setFieldErrors] =
    useState<JobApplicationFormErrors>({});

  useEffect(() => {
    dialogRef.current?.showModal();
    fieldRefs.current.company?.focus();
  }, []);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      await onCreate(result.data);
      closeDialog();
    } catch {
      // The parent rerenders the friendly mutation error and keeps the draft.
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-describedby="add-application-description"
      aria-labelledby="add-application-title"
      className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl overflow-hidden rounded-xl border border-line bg-canvas p-0 text-ink shadow-[0_24px_64px_rgba(30,31,33,0.18)] backdrop:bg-ink/30 backdrop:backdrop-blur-[1px] open:flex open:flex-col"
      onCancel={(event) => {
        event.preventDefault();
        if (!isCreating) closeDialog();
      }}
      onClose={onClose}
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-6 md:py-5">
        <div>
          <h2
            id="add-application-title"
            className="text-xl font-semibold tracking-[-0.01em] text-ink"
          >
            Add application
          </h2>
          <p
            id="add-application-description"
            className="mt-1 text-sm text-muted"
          >
            Add a job opportunity to your application board.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-xl leading-none text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          disabled={isCreating}
          onClick={closeDialog}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <form
        className="flex min-h-0 flex-1 flex-col"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <JobApplicationFormFields
            disabled={isCreating}
            errors={fieldErrors}
            idPrefix="add-application"
            values={values}
            onChange={handleFieldChange}
            setFieldRef={(field, element) => {
              if (element) fieldRefs.current[field] = element;
            }}
          />

          {hasCreateError ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              The application could not be created. Please try again.
            </p>
          ) : null}
        </div>

        <div
          className="flex shrink-0 justify-end gap-2 border-t border-line bg-canvas px-5 py-4 md:px-6"
          role="group"
          aria-label="Add application actions"
        >
          <button
            type="button"
            className={`${buttonClassName} border border-line bg-canvas text-ink hover:bg-hover`}
            disabled={isCreating}
            onClick={closeDialog}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${buttonClassName} bg-primary text-ink hover:bg-primary-hover`}
            disabled={isCreating}
          >
            Add application
          </button>
        </div>
      </form>
    </dialog>
  );
}
