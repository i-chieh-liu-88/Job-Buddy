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
      className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl"
      onCancel={(event) => {
        event.preventDefault();
        if (!isCreating) closeDialog();
      }}
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <h2 id="add-application-title" className="text-xl font-semibold">
            Add application
          </h2>
          <p
            id="add-application-description"
            className="mt-1 text-sm text-slate-600"
          >
            Add a job opportunity to your application board.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          disabled={isCreating}
          onClick={closeDialog}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <form className="space-y-4 px-6 py-5" noValidate onSubmit={handleSubmit}>
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
          <p className="text-sm text-rose-700" role="alert">
            The application could not be created. Please try again.
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
          <button type="button" disabled={isCreating} onClick={closeDialog}>
            Cancel
          </button>
          <button type="submit" disabled={isCreating}>
            Add application
          </button>
        </div>
      </form>
    </dialog>
  );
}
