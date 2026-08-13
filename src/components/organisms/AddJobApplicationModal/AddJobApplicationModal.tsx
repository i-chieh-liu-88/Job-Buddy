import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from "../../atoms/CenterMorphModal/CenterMorphModal";
import { DateWheelPicker } from "../../molecules/DateWheelPicker/DateWheelPicker";
import { StatefulButton } from "../../atoms/StatefulButton/StatefulButton";
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
  const fieldRefs = useRef<
    Partial<Record<JobApplicationFormField, JobApplicationFormControl>>
  >({});
  const companyFieldRef = useRef<HTMLElement | null>(null);
  const formId = useId();
  const [isOpen, setIsOpen] = useState(true);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [values, setValues] = useState<JobApplicationFormValues>(
    emptyJobApplicationFormValues,
  );
  const [fieldErrors, setFieldErrors] =
    useState<JobApplicationFormErrors>({});

  useEffect(() => {
    if (isOpen) return;

    const closeTimer = window.setTimeout(onClose, 460);
    return () => window.clearTimeout(closeTimer);
  }, [isOpen, onClose]);

  function closeDialog() {
    if (!isCreating) setIsOpen(false);
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
      if (firstInvalidField) {
        queueMicrotask(() => fieldRefs.current[firstInvalidField]?.focus());
      }
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
    <CenterMorphModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isCreating) setIsOpen(false);
      }}
    >
      <CenterMorphModalContent
        ariaDescribedBy="add-application-description"
        ariaLabel="Add application"
        backdropClassName="bg-black/65 backdrop-blur-sm"
        className="max-h-[calc(100dvh-1rem)] max-w-2xl rounded-xl border-line bg-canvas text-ink"
        dismissible={!isCreating}
        initialFocusRef={companyFieldRef}
        showCloseButton={false}
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
            idPrefix={`add-application-${formId}`}
            values={values}
            onChange={handleFieldChange}
            onOpenDatePicker={() => setIsDatePickerOpen(true)}
            setFieldRef={(field, element) => {
              if (element) fieldRefs.current[field] = element;
              if (field === "company") companyFieldRef.current = element;
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
          <StatefulButton
            type="submit"
            className={`${buttonClassName} bg-primary text-ink hover:bg-primary-hover`}
            state={isCreating ? "loading" : hasCreateError ? "error" : "idle"}
            loadingText="Adding…"
            errorText="Try again"
          >
            Add application
          </StatefulButton>
        </div>
      </form>
      {isDatePickerOpen ? (
        <DateWheelPicker
          value={values.applied_date}
          onCancel={() => setIsDatePickerOpen(false)}
          onConfirm={(value) => {
            handleFieldChange("applied_date", value);
            setIsDatePickerOpen(false);
          }}
        />
      ) : null}
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}
