import { useState } from "react";
import { z } from "zod";
import {
  useCompanyResearch,
  useDeleteCompanyResearch,
  useInterviewers,
  useUpsertCompanyResearch,
} from "../../../hooks/useCompanyResearch";
import { StatefulButton } from "../../atoms/StatefulButton/StatefulButton";
import type { CompanyResearch } from "../../../types/database";

type CompanyResearchProps = {
  jobApplicationId: string;
};

type CompanyResearchPanelProps = CompanyResearchProps & {
  hasInterviewersError: boolean;
  hasResearchError: boolean;
  interviewers: Array<{ id: string }>;
  research: CompanyResearch | null | undefined;
};

type ResearchDraft = {
  culture_notes: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  salary_source: string;
};

const emptyDraft: ResearchDraft = {
  culture_notes: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "",
  salary_source: "",
};

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

export function CompanyResearch({ jobApplicationId }: CompanyResearchProps) {
  const researchQuery = useCompanyResearch(jobApplicationId);
  const interviewersQuery = useInterviewers(jobApplicationId);

  const panelKey = [
    jobApplicationId,
    researchQuery.data?.updated_at ?? "empty",
    ...(interviewersQuery.data?.map((interviewer) => interviewer.id) ?? []),
  ].join(":");

  return (
    <CompanyResearchPanel
      key={panelKey}
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
  const [draft, setDraft] = useState<ResearchDraft>(() => draftFromResearch(research));
  const [isExpanded, setIsExpanded] = useState(() => hasResearchContent(research, interviewers.length));
  const [formError, setFormError] = useState<string | null>(null);

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
  return (
    <section className="mt-8 border-t border-line pt-6" aria-labelledby="company-research-title">
      <button
        type="button"
        aria-label="Company Research"
        className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        aria-expanded={isExpanded}
        aria-controls="company-research-panel"
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span>
          <span id="company-research-title" className="block text-base font-semibold text-ink">Company Research</span>
          <span className="mt-1 block text-sm text-muted">
            {hasResearchContent(research, interviewers.length) ? "Research added" : "Not started"}
          </span>
        </span>
        <span aria-hidden="true" className="text-muted">{isExpanded ? "−" : "+"}</span>
      </button>

      {hasResearchError ? <p className="mt-4 text-sm text-danger" role="alert">Could not load company research. Please try again.</p> : null}
      {hasInterviewersError ? <p className="mt-4 text-sm text-danger" role="alert">Could not load interviewers. Please try again.</p> : null}

      {isExpanded ? (
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
              <button type="button" className={buttonClassName}>Add interviewer</button>
            </div>
            {interviewers.length ? null : <p className="mt-3 text-sm text-muted">No interviewers added yet.</p>}
          </div>
        </div>
      ) : null}
    </section>
  );
}
