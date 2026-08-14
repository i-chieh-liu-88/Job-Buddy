import { useState } from "react";
import {
  useCreateInterview,
  useDeleteInterview,
  useInterviewsForApplication,
  useUpdateInterview,
} from "../../../hooks/useInterviews";
import type { Interview } from "../../../types/database";

type InterviewRoundsProps = {
  jobApplicationId: string;
};

type InterviewDraft = {
  round_label: string;
  scheduled_at: string;
  location_or_link: string;
  notes: string;
};

const emptyDraft: InterviewDraft = {
  round_label: "",
  scheduled_at: "",
  location_or_link: "",
  notes: "",
};

const buttonClassName =
  "inline-flex h-9 items-center justify-center rounded-md border border-line bg-canvas px-3 text-xs font-medium text-ink transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";

function toLocalInputValue(isoValue: string) {
  const date = new Date(isoValue);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatScheduledAt(isoValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoValue));
}

function draftFromInterview(interview: Interview): InterviewDraft {
  return {
    round_label: interview.round_label,
    scheduled_at: toLocalInputValue(interview.scheduled_at),
    location_or_link: interview.location_or_link ?? "",
    notes: interview.notes ?? "",
  };
}

export function InterviewRounds({ jobApplicationId }: InterviewRoundsProps) {
  const interviewsQuery = useInterviewsForApplication(jobApplicationId);
  const createInterview = useCreateInterview();
  const updateInterview = useUpdateInterview();
  const deleteInterview = useDeleteInterview();
  const [draft, setDraft] = useState<InterviewDraft>(emptyDraft);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Interview | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = createInterview.isPending || updateInterview.isPending;

  function startAdd() {
    setDraft(emptyDraft);
    setEditingInterviewId(null);
    setFormError(null);
    setIsAdding(true);
  }

  function startEdit(interview: Interview) {
    setDraft(draftFromInterview(interview));
    setEditingInterviewId(interview.id);
    setFormError(null);
    setIsAdding(false);
  }

  function cancelForm() {
    setDraft(emptyDraft);
    setEditingInterviewId(null);
    setFormError(null);
    setIsAdding(false);
  }

  function updateDraft(field: keyof InterviewDraft, value: string) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    setFormError(null);
  }

  async function saveInterviewRound() {
    if (!draft.round_label.trim()) {
      setFormError("Round label is required.");
      return;
    }
    if (!draft.scheduled_at) {
      setFormError("Date and time are required.");
      return;
    }

    const input = {
      round_label: draft.round_label.trim(),
      scheduled_at: new Date(draft.scheduled_at).toISOString(),
      location_or_link: draft.location_or_link.trim() || null,
      notes: draft.notes.trim() || null,
    };

    try {
      if (editingInterviewId) {
        await updateInterview.mutateAsync({
          id: editingInterviewId,
          jobApplicationId,
          ...input,
        });
      } else {
        await createInterview.mutateAsync({
          job_application_id: jobApplicationId,
          ...input,
        });
      }
      cancelForm();
    } catch {
      // Mutation state exposes a retryable error without clearing the draft.
    }
  }

  async function confirmDelete() {
    if (!deleteCandidate) return;
    try {
      await deleteInterview.mutateAsync({
        id: deleteCandidate.id,
        jobApplicationId,
      });
      setDeleteCandidate(null);
    } catch {
      // Keep the confirmation visible for retry after a mutation error.
    }
  }

  const isFormVisible = isAdding || editingInterviewId !== null;

  return (
    <section className="mt-8 border-t border-line pt-6" aria-labelledby="interview-rounds-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="interview-rounds-title" className="text-base font-semibold text-ink">
            Interview rounds
          </h3>
          <p className="mt-1 text-sm text-muted">Track every conversation for this application.</p>
        </div>
        {!isFormVisible ? (
          <button type="button" className={buttonClassName} onClick={startAdd}>
            Add interview round
          </button>
        ) : null}
      </div>

      {isFormVisible ? (
        <div className="mt-4 space-y-3 rounded-lg border border-line bg-surface p-4" role="group" aria-label="Interview round form">
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="interview-round-label">Round label</label>
            <input id="interview-round-label" className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink" value={draft.round_label} disabled={isSubmitting} onChange={(event) => updateDraft("round_label", event.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="interview-scheduled-at">Date and time</label>
            <input id="interview-scheduled-at" type="datetime-local" className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink" value={draft.scheduled_at} disabled={isSubmitting} onChange={(event) => updateDraft("scheduled_at", event.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="interview-location">Location or link</label>
            <input id="interview-location" className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink" value={draft.location_or_link} disabled={isSubmitting} onChange={(event) => updateDraft("location_or_link", event.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="interview-notes">Notes</label>
            <textarea id="interview-notes" className="mt-1 min-h-20 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink" value={draft.notes} disabled={isSubmitting} onChange={(event) => updateDraft("notes", event.target.value)} />
          </div>
          {formError ? <p className="text-sm text-danger" role="alert">{formError}</p> : null}
          {createInterview.isError || updateInterview.isError ? <p className="text-sm text-danger" role="alert">The interview round could not be saved. Please try again.</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClassName} disabled={isSubmitting} onClick={cancelForm}>Cancel</button>
            <button type="button" className={`${buttonClassName} bg-primary hover:bg-primary-hover`} disabled={isSubmitting} onClick={() => void saveInterviewRound()}>
              {isSubmitting ? "Saving…" : "Save interview round"}
            </button>
          </div>
        </div>
      ) : null}

      {interviewsQuery.isPending ? <p className="mt-4 text-sm text-muted" role="status">Loading interview rounds…</p> : null}
      {interviewsQuery.isError ? <p className="mt-4 text-sm text-danger" role="alert">Could not load interview rounds. Please try again.</p> : null}
      {!interviewsQuery.isPending && !interviewsQuery.isError && interviewsQuery.data?.length === 0 ? <p className="mt-4 text-sm text-muted">No interview rounds scheduled yet.</p> : null}

      {interviewsQuery.data?.length ? (
        <ul className="mt-4 space-y-3">
          {interviewsQuery.data.map((interview) => (
            <li key={interview.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{interview.round_label}</p>
                  <p className="mt-1 text-sm text-muted">{formatScheduledAt(interview.scheduled_at)}</p>
                  {interview.location_or_link ? <p className="mt-1 break-words text-sm text-muted">{interview.location_or_link}</p> : null}
                  {interview.notes ? <p className="mt-2 text-sm text-muted">{interview.notes}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button type="button" className={buttonClassName} onClick={() => startEdit(interview)}>Edit {interview.round_label}</button>
                  <button type="button" className={`${buttonClassName} border-danger/40 text-danger hover:bg-danger/5`} onClick={() => setDeleteCandidate(interview)}>Delete {interview.round_label}</button>
                </div>
              </div>
              {deleteCandidate?.id === interview.id ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3" role="group" aria-label={`Delete ${interview.round_label} confirmation`}>
                  <p className="mr-auto text-sm text-danger">Delete this interview round?</p>
                  <button type="button" className={buttonClassName} disabled={deleteInterview.isPending} onClick={() => setDeleteCandidate(null)}>Cancel delete</button>
                  <button type="button" className={`${buttonClassName} bg-danger text-white hover:bg-danger/90`} disabled={deleteInterview.isPending} onClick={confirmDelete}>Confirm delete {interview.round_label}</button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {deleteInterview.isError ? <p className="mt-3 text-sm text-danger" role="alert">The interview round could not be deleted. Please try again.</p> : null}
    </section>
  );
}
