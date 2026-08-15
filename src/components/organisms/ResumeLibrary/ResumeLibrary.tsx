import { useState } from "react";
import type { Resume } from "../../../types/database";
import { AttachmentUpload } from "../../atoms/AttachmentUpload/AttachmentUpload";
import { TextReveal } from "../../atoms/TextReveal/TextReveal";
import { ACCEPTED_RESUME_FILE_TYPES, MAX_RESUME_FILE_SIZE } from "../../../hooks/useResumes";
import { ResumeUploadModal } from "../ResumeUploadModal/ResumeUploadModal";

type ResumeLibraryProps = {
  hasDeleteError: boolean;
  hasUploadError: boolean;
  isDeleting: boolean;
  isUploading: boolean;
  resumes: Resume[];
  onDelete: (resume: Resume) => Promise<unknown>;
  onUpload: (input: { file: File; label: string }) => Promise<unknown>;
};

function displayFileType(fileType: string) {
  if (fileType === "application/pdf") return "PDF";
  if (fileType === "application/msword") return "DOC";
  return "DOCX";
}

function formatFileSize(fileSize: number) {
  if (fileSize < 1024 * 1024) return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumeLibrary({
  hasDeleteError,
  hasUploadError,
  isDeleting,
  isUploading,
  resumes,
  onDelete,
  onUpload,
}: ResumeLibraryProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Resume | null>(null);

  return (
    <section aria-labelledby="resumes-title" className="pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 id="resumes-title" className="mt-3 font-display text-4xl font-medium tracking-[-0.045em] text-ink sm:text-5xl"><TextReveal as="span" delay={0.15} split="char" stagger={0.035} text="Resumes" /></h1>
          <TextReveal as="p" className="mt-3 max-w-xl text-sm leading-6 text-muted" delay={0.52} stagger={0.025} text="Keep the versions you tailor for each opportunity in one private library." />
        </div>
        <button className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-canvas px-4 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" type="button" onClick={() => setIsUploadOpen(true)}>
          Upload resume
        </button>
      </header>

      {resumes.length === 0 ? (
        <div className="mt-8 rounded-xl border border-line bg-surface/70 p-4 sm:p-6">
          <AttachmentUpload
            accept={Array.from(ACCEPTED_RESUME_FILE_TYPES).join(",")}
            description="PDF, DOC, or DOCX · up to 10 MB"
            maxFileSize={MAX_RESUME_FILE_SIZE}
            multiple={false}
            title="Drop your resume here or browse files"
            value={[]}
            onFilesAdded={(_items, files) => {
              const file = files[0] ?? null;
              if (file) {
                setPendingFile(file);
                setIsUploadOpen(true);
              }
            }}
            onFilesRejected={() => undefined}
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line rounded-xl border border-line bg-surface/70">
          {resumes.map((resume) => (
            <li key={resume.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{resume.label}</p>
                <p className="mt-1 text-xs text-muted">{displayFileType(resume.file_type)} · {formatFileSize(resume.file_size)} · Uploaded {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(resume.uploaded_at))}</p>
              </div>
              {pendingDelete?.id === resume.id ? (
                <div className="flex items-center gap-2" role="group" aria-label={`Delete ${resume.label} confirmation`}>
                  <span className="text-sm text-danger">Remove {resume.label}?</span>
                  <button className="rounded-md border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:bg-hover" disabled={isDeleting} type="button" onClick={() => setPendingDelete(null)}>Cancel</button>
                  <button className="rounded-md border border-danger/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-danger hover:bg-danger/5" disabled={isDeleting} type="button" onClick={() => onDelete(resume)}>Confirm delete</button>
                </div>
              ) : (
                <button aria-label={`Delete ${resume.label}`} className="rounded-md border border-danger/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-danger hover:bg-danger/5" disabled={isDeleting} type="button" onClick={() => setPendingDelete(resume)}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      )}
      {hasDeleteError ? <p className="mt-4 text-sm text-danger" role="alert">The resume could not be deleted. Please try again.</p> : null}
      {isUploadOpen ? <ResumeUploadModal hasUploadError={hasUploadError} initialFile={pendingFile} isUploading={isUploading} onClose={() => { setIsUploadOpen(false); setPendingFile(null); }} onUpload={onUpload} /> : null}
    </section>
  );
}
