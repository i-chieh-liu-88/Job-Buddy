import { useState } from "react";
import { z } from "zod";
import {
  useCompanyResearch,
  useCreateInterviewer,
  useDeleteCompanyResearch,
  useDeleteInterviewer,
  useInterviewers,
  useUpdateInterviewer,
  useUpsertCompanyResearch,
} from "../../../hooks/useCompanyResearch";
import { StatefulButton } from "../../atoms/StatefulButton/StatefulButton";
import type { CompanyResearch, Interviewer } from "../../../types/database";

type CompanyResearchProps = {
  jobApplicationId: string;
};

type CompanyResearchPanelProps = CompanyResearchProps & {
  hasInterviewersError: boolean;
  hasResearchError: boolean;
  interviewers: Interviewer[];
  research: CompanyResearch | null | undefined;
};

type ResearchDraft = {
  culture_notes: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  salary_source: string;
};

type InterviewerDraft = {
  id?: string;
  name: string;
  role: string;
  linkedin_url: string;
  notes: string;
};

const emptyDraft: ResearchDraft = {
  culture_notes: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "",
  salary_source: "",
};

const emptyInterviewerDraft: InterviewerDraft = { name: "", role: "", linkedin_url: "", notes: "" };

const currencyOptions = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD"] as const;

const researchSchema = z
  .object({
    culture_notes: z.string(),
    salary_min: z.number().nullable(),
    salary_max: z.number().nullable(),
    salary_currency: z.string().nullable(),
    salary_source: z.string(),
  })
  .superRefine((value, context) => {
    if (value.salary_min !== null && value.salary_min < 0) {
      context.addIssue({ code: "custom", path: ["salary_min"], message: "Salary cannot be negative." });
    }
    if (value.salary_max !== null && value.salary_max < 0) {
      context.addIssue({ code: "custom", path: ["salary_max"], message: "Salary cannot be negative." });
    }
    if (value.salary_min !== null && value.salary_max !== null && value.salary_min > value.salary_max) {
      context.addIssue({ code: "custom", path: ["salary_max"], message: "Maximum salary must be at least the minimum." });
    }
    if (value.salary_currency !== null && !currencyOptions.includes(value.salary_currency as (typeof currencyOptions)[number])) {
      context.addIssue({ code: "custom", path: ["salary_currency"], message: "Choose a supported currency." });
    }
  });

const controlClassName =
  "mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";
const buttonClassName =
  "inline-flex h-9 items-center justify-center rounded-md border border-line bg-canvas px-3 text-xs font-medium text-ink transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";

function draftFromResearch(research: CompanyResearch | null | undefined): ResearchDraft {
  if (!research) return emptyDraft;
  return {
    culture_notes: research.culture_notes ?? "",
    salary_min: research.salary_min === null ? "" : String(research.salary_min),
    salary_max: research.salary_max === null ? "" : String(research.salary_max),
    salary_currency: research.salary_currency ?? "",
    salary_source: research.salary_source ?? "",
  };
}

function hasResearchContent(research: CompanyResearch | null | undefined, interviewerCount: number) {
  return Boolean(
    interviewerCount > 0 ||
      research?.culture_notes?.trim() ||
      research?.salary_min !== null && research?.salary_min !== undefined ||
      research?.salary_max !== null && research?.salary_max !== undefined ||
      research?.salary_currency ||
      research?.salary_source?.trim(),
  );
}

function interviewerDraftFromInterviewer(interviewer: Interviewer): InterviewerDraft {
  return {
    id: interviewer.id,
    name: interviewer.name,
    role: interviewer.role ?? "",
    linkedin_url: interviewer.linkedin_url ?? "",
    notes: interviewer.notes ?? "",
  };
}

export function CompanyResearch({ jobApplicationId }: CompanyResearchProps) {
  const researchQuery = useCompanyResearch(jobApplicationId);
  const interviewersQuery = useInterviewers(jobApplicationId);

  return (
    <CompanyResearchPanel
      hasInterviewersError={interviewersQuery.isError}
      hasResearchError={researchQuery.isError}
      interviewers={interviewersQuery.data ?? []}
      jobApplicationId={jobApplicationId}
      research={researchQuery.data}
    />
  );
}

function CompanyResearchPanel({
  hasInterviewersError,
  hasResearchError,
  interviewers,
  jobApplicationId,
  research,
}: CompanyResearchPanelProps) {
  const upsertResearch = useUpsertCompanyResearch();
  const deleteResearch = useDeleteCompanyResearch();
  const createInterviewer = useCreateInterviewer();
  const updateInterviewer = useUpdateInterviewer();
  const deleteInterviewer = useDeleteInterviewer();
  const [draft, setDraft] = useState<ResearchDraft>(() => draftFromResearch(research));
  const [isExpanded, setIsExpanded] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [interviewerDraft, setInterviewerDraft] = useState<InterviewerDraft>(emptyInterviewerDraft);
  const [isInterviewerEditorVisible, setIsInterviewerEditorVisible] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Interviewer | null>(null);
  const [interviewerError, setInterviewerError] = useState<string | null>(null);

  async function saveResearch() {
    const parsed = researchSchema.safeParse({
      culture_notes: draft.culture_notes.trim(),
      salary_min: draft.salary_min.trim() ? Number(draft.salary_min) : null,
      salary_max: draft.salary_max.trim() ? Number(draft.salary_max) : null,
      salary_currency: draft.salary_currency || null,
      salary_source: draft.salary_source.trim(),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Review the research fields.");
      return;
    }

    setFormError(null);
    const isBlank = !parsed.data.culture_notes &&
      parsed.data.salary_min === null &&
      parsed.data.salary_max === null &&
      parsed.data.salary_currency === null &&
      !parsed.data.salary_source;

    try {
      if (isBlank) {
        await deleteResearch.mutateAsync({ applicationId: jobApplicationId });
      } else {
        await upsertResearch.mutateAsync({ job_application_id: jobApplicationId, ...parsed.data });
      }
    } catch {
      setFormError("The company research could not be saved. Please try again.");
    }
  }

  const isSaving = upsertResearch.isPending || deleteResearch.isPending;
  const isInterviewerSaving = createInterviewer.isPending || updateInterviewer.isPending;
  const expanded = isExpanded ?? hasResearchContent(research, interviewers.length);

  function startAddInterviewer() {
    setInterviewerDraft(emptyInterviewerDraft);
    setInterviewerError(null);
    setDeleteCandidate(null);
    setIsInterviewerEditorVisible(true);
  }

  function startEditInterviewer(interviewer: Interviewer) {
    setInterviewerDraft(interviewerDraftFromInterviewer(interviewer));
    setInterviewerError(null);
    setDeleteCandidate(null);
    setIsInterviewerEditorVisible(true);
  }

  function cancelInterviewerEditor() {
    setInterviewerDraft(emptyInterviewerDraft);
    setInterviewerError(null);
    setIsInterviewerEditorVisible(false);
  }

  async function saveInterviewer() {
    const name = interviewerDraft.name.trim();
    if (!name) {
      setInterviewerError("Interviewer name is required.");
      return;
    }
    const linkedinUrl = interviewerDraft.linkedin_url.trim();
    if (linkedinUrl) {
      try {
        const parsed = new URL(linkedinUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("invalid");
      } catch {
        setInterviewerError("Enter a valid LinkedIn URL.");
        return;
      }
    }
    setInterviewerError(null);
    const payload = {
      job_application_id: jobApplicationId,
      name,
      role: interviewerDraft.role.trim() || null,
      linkedin_url: linkedinUrl || null,
      notes: interviewerDraft.notes.trim() || null,
    };
    try {
      if (interviewerDraft.id) {
        await updateInterviewer.mutateAsync({ id: interviewerDraft.id, ...payload });
      } else {
        await createInterviewer.mutateAsync(payload);
      }
      cancelInterviewerEditor();
    } catch {
      setInterviewerError("The interviewer could not be saved. Please try again.");
    }
  }

  async function confirmDeleteInterviewer() {
    if (!deleteCandidate) return;
    try {
      await deleteInterviewer.mutateAsync({ id: deleteCandidate.id, jobApplicationId });
      setDeleteCandidate(null);
    } catch {
      setInterviewerError("The interviewer could not be deleted. Please try again.");
    }
  }
  return (
    <section className="mt-8 border-t border-line pt-6" aria-labelledby="company-research-title">
      <button
        type="button"
        aria-label="Company Research"
        className="flex w-full items-center justify-between gap-3 text-left font-sans normal-case focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        aria-expanded={expanded}
        aria-controls="company-research-panel"
        onClick={() => setIsExpanded((current) => !(current ?? hasResearchContent(research, interviewers.length)))}
      >
        <span>
          <span id="company-research-title" className="block text-base font-semibold text-ink">Company Research</span>
          <span className="mt-1 block text-sm text-muted">
            {hasResearchContent(research, interviewers.length) ? "Research added" : "Not started"}
          </span>
        </span>
        <span aria-hidden="true" className="text-muted">{expanded ? "−" : "+"}</span>
      </button>

      {hasResearchError ? <p className="mt-4 text-sm text-danger" role="alert">Could not load company research. Please try again.</p> : null}
      {hasInterviewersError ? <p className="mt-4 text-sm text-danger" role="alert">Could not load interviewers. Please try again.</p> : null}

      {expanded ? (
        <div id="company-research-panel" className="mt-5 space-y-5" role="region" aria-labelledby="company-research-title">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="company-culture-notes">Culture notes</label>
              <textarea id="company-culture-notes" className="mt-1 min-h-24 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink" value={draft.culture_notes} disabled={isSaving} onChange={(event) => setDraft((current) => ({ ...current, culture_notes: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink" htmlFor="company-salary-min">Salary minimum</label>
                <input id="company-salary-min" type="number" min="0" className={controlClassName} value={draft.salary_min} disabled={isSaving} onChange={(event) => setDraft((current) => ({ ...current, salary_min: event.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink" htmlFor="company-salary-max">Salary maximum</label>
                <input id="company-salary-max" type="number" min="0" className={controlClassName} value={draft.salary_max} disabled={isSaving} onChange={(event) => setDraft((current) => ({ ...current, salary_max: event.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="company-salary-currency">Currency</label>
              <select id="company-salary-currency" className={controlClassName} value={draft.salary_currency} disabled={isSaving} onChange={(event) => setDraft((current) => ({ ...current, salary_currency: event.target.value }))}>
                <option value="">Select currency</option>
                {currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="company-salary-source">Salary source / note</label>
              <input id="company-salary-source" className={controlClassName} value={draft.salary_source} disabled={isSaving} onChange={(event) => setDraft((current) => ({ ...current, salary_source: event.target.value }))} />
            </div>
            {formError ? <p className="text-sm text-danger" role="alert">{formError}</p> : null}
            {upsertResearch.isError || deleteResearch.isError ? <p className="text-sm text-danger" role="alert">The company research could not be saved. Please try again.</p> : null}
            <StatefulButton type="button" className={`${buttonClassName} bg-primary text-ink hover:bg-primary-hover`} state={isSaving ? "loading" : "idle"} loadingText="Saving…" onClick={() => void saveResearch()}>Save research</StatefulButton>
          </div>

          <div className="border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-ink">Interviewers</h4>
                <p className="mt-1 text-sm text-muted">Keep names and context for people you meet.</p>
              </div>
              <button type="button" className={buttonClassName} onClick={startAddInterviewer} disabled={isInterviewerSaving}>Add interviewer</button>
            </div>
            {interviewers.length ? (
              <div className="mt-3 space-y-3">
                {interviewers.map((interviewer) => (
                  <article key={interviewer.id} className="rounded-lg border border-line bg-canvas p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{interviewer.name}</p>
                        {interviewer.role ? <p className="mt-1 text-sm text-muted">{interviewer.role}</p> : null}
                        {interviewer.linkedin_url ? <a className="mt-1 block truncate text-sm text-focus underline" href={interviewer.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a> : null}
                        {interviewer.notes ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{interviewer.notes}</p> : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" className={buttonClassName} onClick={() => startEditInterviewer(interviewer)} disabled={isInterviewerSaving}>Edit {interviewer.name}</button>
                        <button type="button" className={`${buttonClassName} text-danger`} onClick={() => { setDeleteCandidate(interviewer); setInterviewerError(null); }} disabled={isInterviewerSaving}>Delete {interviewer.name}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-muted">No interviewers added yet.</p>}
            {isInterviewerEditorVisible ? (
              <div className="mt-4 space-y-3 rounded-lg border border-line bg-canvas p-3" aria-label="Interviewer editor">
                <div>
                  <label className="block text-sm font-medium text-ink" htmlFor="interviewer-name">Interviewer name</label>
                  <input id="interviewer-name" className={controlClassName} value={interviewerDraft.name} disabled={isInterviewerSaving} onChange={(event) => setInterviewerDraft((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink" htmlFor="interviewer-role">Interviewer role</label>
                  <input id="interviewer-role" className={controlClassName} value={interviewerDraft.role} disabled={isInterviewerSaving} onChange={(event) => setInterviewerDraft((current) => ({ ...current, role: event.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink" htmlFor="interviewer-linkedin">Interviewer LinkedIn</label>
                  <input id="interviewer-linkedin" type="url" className={controlClassName} value={interviewerDraft.linkedin_url} disabled={isInterviewerSaving} onChange={(event) => setInterviewerDraft((current) => ({ ...current, linkedin_url: event.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink" htmlFor="interviewer-notes">Interviewer notes</label>
                  <textarea id="interviewer-notes" className="mt-1 min-h-20 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink" value={interviewerDraft.notes} disabled={isInterviewerSaving} onChange={(event) => setInterviewerDraft((current) => ({ ...current, notes: event.target.value }))} />
                </div>
                {interviewerError ? <p className="text-sm text-danger" role="alert">{interviewerError}</p> : null}
                <div className="flex gap-2">
                  <StatefulButton type="button" className={`${buttonClassName} bg-primary text-ink hover:bg-primary-hover`} state={isInterviewerSaving ? "loading" : "idle"} loadingText="Saving…" onClick={() => void saveInterviewer()}>Save interviewer</StatefulButton>
                  <button type="button" className={buttonClassName} onClick={cancelInterviewerEditor} disabled={isInterviewerSaving}>Cancel interviewer</button>
                </div>
              </div>
            ) : null}
            {deleteCandidate ? (
              <div className="mt-4 rounded-lg border border-danger/40 bg-danger/5 p-3" role="alertdialog" aria-label={`Delete ${deleteCandidate.name}`}>
                <p className="text-sm text-ink">Delete {deleteCandidate.name}?</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" className={`${buttonClassName} text-danger`} onClick={() => void confirmDeleteInterviewer()} disabled={deleteInterviewer.isPending}>Confirm delete interviewer</button>
                  <button type="button" className={buttonClassName} onClick={() => setDeleteCandidate(null)} disabled={deleteInterviewer.isPending}>Cancel delete interviewer</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
