import { ExternalLink, MapPin, StickyNote } from "lucide-react";
import { useState } from "react";
import { MorphingModal } from "../../atoms/MorphingModal/MorphingModal";
import type { Interview } from "../../../types/database";

type InterviewEventPopoverProps = {
  company: string;
  interview: Interview;
  onOpenApplication: (applicationId: string) => void;
  position: string;
};

function formatDateTime(scheduledAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  }).format(new Date(scheduledAt));
}

export function InterviewEventPopover({
  company,
  interview,
  onOpenApplication,
  position,
}: InterviewEventPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const accessibleName = `${interview.round_label} at ${company}, ${formatDateTime(interview.scheduled_at)}`;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={accessibleName}
        className="block w-full truncate rounded-md bg-hover px-2 py-1.5 text-left text-xs text-ink transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        onClick={() => setIsOpen(true)}
      >
        <span className="font-mono text-[0.625rem] text-muted">
          {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(interview.scheduled_at))}
        </span>
        <span className="ml-1.5 font-medium">{company}</span>
        <span className="ml-1.5 text-muted">{interview.round_label}</span>
      </button>
      <MorphingModal
        className="max-w-md"
        placement="center"
        viewId={isOpen ? interview.id : null}
        onClose={() => setIsOpen(false)}
      >
        <section data-testid="interview-event-modal" aria-labelledby={`interview-event-title-${interview.id}`}>
          <p className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted">Interview round</p>
          <h2 id={`interview-event-title-${interview.id}`} className="mt-2 text-lg font-semibold text-ink">{interview.round_label}</h2>
          <p className="mt-1 text-sm text-muted">{company} · {position}</p>
          <p className="mt-4 text-sm font-medium text-ink">{formatDateTime(interview.scheduled_at)}</p>
          {interview.location_or_link ? (
            <a href={interview.location_or_link} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">{interview.location_or_link}</span>
              <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
            </a>
          ) : null}
          {interview.notes ? (
            <p className="mt-3 flex gap-2 border-t border-line pt-3 text-sm leading-5 text-muted">
              <StickyNote aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>{interview.notes}</span>
            </p>
          ) : null}
          <button
            type="button"
            className="mt-5 w-full border border-line px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={() => onOpenApplication(interview.job_application_id)}
          >
            Open application
          </button>
        </section>
      </MorphingModal>
    </>
  );
}
