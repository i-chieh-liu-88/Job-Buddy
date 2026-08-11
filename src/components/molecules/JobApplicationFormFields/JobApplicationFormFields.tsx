import type {
  JobApplicationFormErrors,
  JobApplicationFormField,
  JobApplicationFormValues,
} from "./jobApplicationFormSchema";
import { jobApplicationStatuses } from "./jobApplicationFormSchema";

export type JobApplicationFormControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

type JobApplicationFormFieldsProps = {
  disabled: boolean;
  errors: JobApplicationFormErrors;
  idPrefix: string;
  onChange: (field: JobApplicationFormField, value: string) => void;
  setFieldRef: (
    field: JobApplicationFormField,
    element: JobApplicationFormControl | null,
  ) => void;
  values: JobApplicationFormValues;
};

const fieldClassName =
  "mt-1 w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100";

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function JobApplicationFormFields({
  disabled,
  errors,
  idPrefix,
  onChange,
  setFieldRef,
  values,
}: JobApplicationFormFieldsProps) {
  function controlId(field: JobApplicationFormField) {
    return `${idPrefix}-${field.replace("_", "-")}`;
  }

  function errorId(field: JobApplicationFormField) {
    return `${controlId(field)}-error`;
  }

  function errorProps(field: JobApplicationFormField) {
    return {
      "aria-describedby": errors[field] ? errorId(field) : undefined,
      "aria-invalid": errors[field] ? (true as const) : undefined,
    };
  }

  function fieldError(field: JobApplicationFormField) {
    const message = errors[field];
    return message ? (
      <p id={errorId(field)} className="mt-1 text-sm text-rose-700" role="alert">
        {message}
      </p>
    ) : null;
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium" htmlFor={controlId("company")}>
          Company
        </label>
        <input
          ref={(element) => setFieldRef("company", element)}
          autoFocus
          className={fieldClassName}
          disabled={disabled}
          id={controlId("company")}
          name="company"
          value={values.company}
          onChange={(event) => onChange("company", event.target.value)}
          {...errorProps("company")}
        />
        {fieldError("company")}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor={controlId("position")}>
          Position
        </label>
        <input
          ref={(element) => setFieldRef("position", element)}
          className={fieldClassName}
          disabled={disabled}
          id={controlId("position")}
          name="position"
          value={values.position}
          onChange={(event) => onChange("position", event.target.value)}
          {...errorProps("position")}
        />
        {fieldError("position")}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor={controlId("job_url")}>
          Job URL
        </label>
        <input
          ref={(element) => setFieldRef("job_url", element)}
          className={fieldClassName}
          disabled={disabled}
          id={controlId("job_url")}
          name="job_url"
          type="url"
          value={values.job_url}
          onChange={(event) => onChange("job_url", event.target.value)}
          {...errorProps("job_url")}
        />
        {fieldError("job_url")}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor={controlId("status")}>
          Status
        </label>
        <select
          ref={(element) => setFieldRef("status", element)}
          className={fieldClassName}
          disabled={disabled}
          id={controlId("status")}
          name="status"
          value={values.status}
          onChange={(event) => onChange("status", event.target.value)}
          {...errorProps("status")}
        >
          {jobApplicationStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        {fieldError("status")}
      </div>

      <div>
        <label
          className="block text-sm font-medium"
          htmlFor={controlId("applied_date")}
        >
          Applied date
        </label>
        <input
          ref={(element) => setFieldRef("applied_date", element)}
          className={fieldClassName}
          disabled={disabled}
          id={controlId("applied_date")}
          name="applied_date"
          type="date"
          value={values.applied_date}
          onChange={(event) => onChange("applied_date", event.target.value)}
          {...errorProps("applied_date")}
        />
        {fieldError("applied_date")}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor={controlId("notes")}>
          Notes
        </label>
        <textarea
          ref={(element) => setFieldRef("notes", element)}
          className={fieldClassName}
          disabled={disabled}
          id={controlId("notes")}
          name="notes"
          value={values.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          {...errorProps("notes")}
        />
        {fieldError("notes")}
      </div>

      <div>
        <label
          className="block text-sm font-medium"
          htmlFor={controlId("resume_version")}
        >
          Resume version
        </label>
        <input
          ref={(element) => setFieldRef("resume_version", element)}
          className={fieldClassName}
          disabled={disabled}
          id={controlId("resume_version")}
          name="resume_version"
          value={values.resume_version}
          onChange={(event) => onChange("resume_version", event.target.value)}
          {...errorProps("resume_version")}
        />
        {fieldError("resume_version")}
      </div>
    </>
  );
}
