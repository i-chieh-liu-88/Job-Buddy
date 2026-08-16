import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Drawer } from "../../atoms/Drawer/Drawer";
import { StatefulButton } from "../../atoms/StatefulButton/StatefulButton";
import { InterviewRounds } from "../InterviewRounds/InterviewRounds";
import { CompanyResearch } from "../CompanyResearch/CompanyResearch";
import { JobApplicationFormFields } from "../../molecules/JobApplicationFormFields/JobApplicationFormFields";
import { DateWheelPicker } from "../../molecules/DateWheelPicker/DateWheelPicker";
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
import { useOpenResume } from "../../../hooks/useResumes";
import type { JobApplication, Resume } from "../../../types/database";

type JobApplicationDetailDrawerProps = {
  application: JobApplication;
  hasDeleteError: boolean;
  hasSaveError: boolean;
  hasResumesError: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  isResumesLoading: boolean;
  onDelete: (id: string) => Promise<unknown>;
  onExitComplete: () => void;
  onOpenChange: (open: boolean) => void;
  onSave: (input: UpdateJobApplicationInput) => Promise<unknown>;
  open: boolean;
  resumes: Resume[];
};

const fieldOrder: JobApplicationFormField[] = [
  "company",
  "position",
  "job_url",
  "status",
  "applied_date",
  "notes",
];

const buttonClassName =
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export function JobApplicationDetailDrawer({
  application,
  hasDeleteError,
  hasSaveError,
  hasResumesError,
  isDeleting,
  isSaving,
  isResumesLoading,
  onDelete,
  onExitComplete,
  onOpenChange,
  onSave,
  open,
  resumes,
}: JobApplicationDetailDrawerProps) {
  const companyFocusRef = useRef<HTMLElement | null>(null);
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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const openResume = useOpenResume();
  const isBusy = isSaving || isDeleting;
  const linkedResume = values.resume_id
    ? resumes.find((resume) => resume.id === values.resume_id)
    : undefined;

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

  function requestClose() {
    if (!isBusy) onOpenChange(false);
  }

  function handleFieldChange(
    field: JobApplicationFormField,
    value: string | null,
  ) {
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
      onOpenChange(false);
    } catch {
      // The parent rerenders the error state after its mutation rejects.
    }
  }

  async function handleDelete() {
    try {
      await onDelete(application.id);
      onOpenChange(false);
    } catch {
      // The parent rerenders the error state after its mutation rejects.
    }
  }

  function handleOpenResume() {
    if (!linkedResume) return;
    void openResume.mutateAsync(linkedResume).catch(() => {});
  }

  return (
    <Drawer
      ariaLabel={`Edit ${application.position}`}
      className="h-dvh w-[calc(100vw-0.5rem)] max-w-none md:w-[32.5rem] md:max-w-[calc(100vw-1rem)]"
      dismissable={!isBusy}
      initialFocusRef={companyFocusRef}
      open={open}
      onExitComplete={onExitComplete}
      onOpenChange={onOpenChange}
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
          aria-label="Close drawer"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-xl leading-none text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          disabled={isBusy}
          onClick={requestClose}
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
            layout="single-column"
            resumePickerDisabled={isResumesLoading || hasResumesError}
            resumes={resumes}
            showResumePicker
            values={values}
            onChange={handleFieldChange}
            onOpenDatePicker={() => setIsDatePickerOpen(true)}
            setFieldRef={(field, element) => {
              if (element) fieldRefs.current[field] = element;
              if (field === "company") companyFocusRef.current = element;
            }}
          />
          {linkedResume ? (
            <div className="mt-4 flex items-center gap-3">
              <StatefulButton
                type="button"
                className={`${buttonClassName} border border-line bg-canvas text-ink hover:bg-hover`}
                errorText="Try again"
                loadingText="Opening…"
                state={openResume.isPending ? "loading" : openResume.isError ? "error" : "idle"}
                onClick={handleOpenResume}
              >
                Open resume
              </StatefulButton>
              <span className="text-sm text-muted">{linkedResume.label}</span>
            </div>
          ) : null}
          {openResume.isError ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              The resume could not be opened. Please try again.
            </p>
          ) : null}
          <CompanyResearch jobApplicationId={application.id} />
          <InterviewRounds jobApplicationId={application.id} />
          {hasResumesError ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              Could not load resumes. The existing resume link will be preserved.
            </p>
          ) : null}
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
              <StatefulButton
                ref={confirmDeleteButtonRef}
                type="button"
                className={`${buttonClassName} bg-danger text-white hover:bg-danger/90`}
                state={isDeleting ? "loading" : hasDeleteError ? "error" : "idle"}
                loadingText="Deleting…"
                errorText="Try again"
                onClick={handleDelete}
              >
                Confirm delete
              </StatefulButton>
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
              onClick={requestClose}
            >
              Cancel
            </button>
            <StatefulButton
              type="submit"
              className={`${buttonClassName} bg-primary text-ink hover:bg-primary-hover`}
              state={isSaving ? "loading" : hasSaveError ? "error" : "idle"}
              loadingText="Saving…"
              errorText="Try again"
            >
              Save changes
            </StatefulButton>
          </div>
        </div>
        {isDatePickerOpen ? (
          <DateWheelPicker
            value={values.applied_date}
            onClear={() => {
              handleFieldChange("applied_date", null);
              setIsDatePickerOpen(false);
            }}
            onCancel={() => setIsDatePickerOpen(false)}
            onConfirm={(value) => {
              handleFieldChange("applied_date", value);
              setIsDatePickerOpen(false);
            }}
          />
        ) : null}
      </form>
    </Drawer>
  );
}
