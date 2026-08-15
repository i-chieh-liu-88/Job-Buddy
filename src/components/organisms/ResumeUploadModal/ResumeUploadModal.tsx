import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  ACCEPTED_RESUME_FILE_TYPES,
  MAX_RESUME_FILE_SIZE,
} from "../../../hooks/useResumes";
import {
  CenterMorphModal,
  CenterMorphModalContent,
} from "../../atoms/CenterMorphModal/CenterMorphModal";
import { StatefulButton } from "../../atoms/StatefulButton/StatefulButton";

type ResumeUploadModalProps = {
  hasUploadError: boolean;
  initialFile?: File | null;
  isUploading: boolean;
  onClose: () => void;
  onUpload: (input: { file: File; label: string }) => Promise<unknown>;
};

const buttonClassName =
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export function ResumeUploadModal({
  hasUploadError,
  initialFile = null,
  isUploading,
  onClose,
  onUpload,
}: ResumeUploadModalProps) {
  const labelRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(initialFile);
  const [errors, setErrors] = useState<{ file?: string; label?: string }>({});

  function validate(selectedFile: File | null, currentLabel: string) {
    const nextErrors: typeof errors = {};
    if (!currentLabel.trim()) nextErrors.label = "A resume label is required.";
    if (!selectedFile) {
      nextErrors.file = "Choose a PDF, DOC, or DOCX file.";
    } else if (!ACCEPTED_RESUME_FILE_TYPES.has(selectedFile.type)) {
      nextErrors.file = "Choose a PDF, DOC, or DOCX file.";
    } else if (selectedFile.size > MAX_RESUME_FILE_SIZE) {
      nextErrors.file = "Resume files must be 10 MB or smaller.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.currentTarget.files?.[0] ?? null;
    setFile(nextFile);
    setErrors((current) => ({ ...current, file: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate(file, label) || !file) return;

    try {
      await onUpload({ file, label: label.trim() });
      onClose();
    } catch {
      // Mutation error is rendered by the parent so the selected file stays available.
    }
  }

  return (
    <CenterMorphModal open onOpenChange={(open) => !open && !isUploading && onClose()}>
      <CenterMorphModalContent
        ariaDescribedBy="resume-upload-description"
        ariaLabel="Upload resume"
        backdropClassName="bg-black/65 backdrop-blur-sm"
        className="max-w-lg rounded-xl border-line bg-canvas text-ink"
        dismissible={!isUploading}
        initialFocusRef={labelRef}
        showCloseButton={false}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-6 md:py-5">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink">Upload resume</h2>
            <p id="resume-upload-description" className="mt-1 text-sm text-muted">
              Add a private PDF or Word document to your library.
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="inline-flex size-10 items-center justify-center rounded-md text-xl text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            disabled={isUploading}
            type="button"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <form noValidate onSubmit={handleSubmit}>
          <div className="space-y-5 px-5 py-5 md:px-6">
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="resume-label">
                Resume label
              </label>
              <input
                ref={labelRef}
                id="resume-label"
                className="mt-1 h-10 w-full rounded-lg border border-line bg-[#111318] px-3 text-sm text-ink outline-none focus:border-focus focus:ring-2 focus:ring-focus/20"
                disabled={isUploading}
                value={label}
                onChange={(event) => {
                  setLabel(event.target.value);
                  setErrors((current) => ({ ...current, label: undefined }));
                }}
              />
              {errors.label ? <p className="mt-1 text-sm text-danger">{errors.label}</p> : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="resume-file">
                Resume file
              </label>
              <input
                id="resume-file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-hover file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-line"
                disabled={isUploading}
                type="file"
                onChange={handleFileChange}
              />
              <p className="mt-2 text-xs text-muted">PDF, DOC, or DOCX · up to 10 MB</p>
              {errors.file ? <p className="mt-1 text-sm text-danger">{errors.file}</p> : null}
            </div>
            {hasUploadError ? (
              <p className="text-sm text-danger" role="alert">
                The resume could not be uploaded. Please try again.
              </p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 border-t border-line px-5 py-4 md:px-6">
            <button className={`${buttonClassName} border border-line bg-canvas text-ink hover:bg-hover`} disabled={isUploading} type="button" onClick={onClose}>
              Cancel
            </button>
            <StatefulButton
              className={`${buttonClassName} bg-primary text-ink hover:bg-primary-hover`}
              loadingText="Uploading…"
              state={isUploading ? "loading" : hasUploadError ? "error" : "idle"}
              type="submit"
            >
              Upload resume
            </StatefulButton>
          </div>
        </form>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
}
