import { Upload } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

type AttachmentUploadProps = {
  accept?: string;
  description: string;
  maxFileSize: number;
  multiple?: boolean;
  title: string;
  value?: unknown[];
  onFilesAdded: (items: unknown[], files: File[]) => void;
  onFilesRejected?: (files: File[], reason: "too-large" | "max-files") => void;
};

export function AttachmentUpload({
  accept,
  description,
  maxFileSize,
  multiple = true,
  title,
  onFilesAdded,
  onFilesRejected,
}: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const [dragging, setDragging] = useState(false);

  function addFiles(files: File[]) {
    const accepted = files.filter((file) => file.size <= maxFileSize);
    const rejected = files.filter((file) => file.size > maxFileSize);
    if (rejected.length > 0) onFilesRejected?.(rejected, "too-large");
    if (accepted.length > 0) onFilesAdded([], multiple ? accepted : accepted.slice(0, 1));
  }

  return (
    <motion.button
      type="button"
      aria-label={title}
      whileTap={reduce ? undefined : { scale: 0.995 }}
      className="group relative isolate flex min-h-52 w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-muted/65 p-6 text-center outline-none transition-colors duration-200 hover:bg-muted/85 focus-visible:ring-2 focus-visible:ring-focus"
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setDragging(true); }}
      onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}
      data-dragging={dragging}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => { addFiles(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }}
      />
      <span aria-hidden="true" className="absolute inset-2 -z-10 rounded-[1.5rem] border border-dashed border-muted/80 transition-colors group-hover:border-focus/60 data-[dragging=true]:border-focus" />
      <motion.span aria-hidden="true" animate={reduce ? undefined : { y: dragging ? -4 : 0, scale: dragging ? 1.08 : 1 }} className="mb-3 grid size-11 place-items-center rounded-2xl bg-muted text-ink">
        <Upload className="size-[18px]" />
      </motion.span>
      <span className="text-sm font-semibold text-ink">{title}</span>
      <span className="mt-1 text-xs leading-5 text-muted">{description}</span>
    </motion.button>
  );
}
