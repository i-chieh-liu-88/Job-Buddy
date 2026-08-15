import { UserButton } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { PanelLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ApplicationNavigation, type ApplicationStageCounts } from "../../components/organisms/ApplicationNavigation/ApplicationNavigation";
import { AnimatedSidebarTrigger } from "../../components/atoms/AnimatedSidebar/AnimatedSidebar";
import { TextReveal } from "../../components/atoms/TextReveal/TextReveal";
import { WorkspaceEngineeringGrid } from "../../components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid";
import { ApplicationShell } from "../../layouts/ApplicationShell/ApplicationShell";
import { useJobApplications } from "../../hooks/useJobApplications";
import { useQuestionBank, useQuestionBankTags } from "../../hooks/useInterviewQuestions";
import { JOB_APPLICATION_STATUS_ORDER } from "../../lib/jobApplicationStatusPresentation";

export function QuestionBankPage() {
  const navigate = useNavigate();
  const applicationsQuery = useJobApplications();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  useEffect(() => { const timer = window.setTimeout(() => setSearch(searchInput), 250); return () => window.clearTimeout(timer); }, [searchInput]);
  const questionsQuery = useQuestionBank({ search, tags: selectedTags });
  const tagsQuery = useQuestionBankTags();
  const stageCounts = useMemo(() => { const applications = applicationsQuery.data ?? []; return JOB_APPLICATION_STATUS_ORDER.reduce<ApplicationStageCounts>((counts, status) => ({ ...counts, [status]: applications.filter((app) => app.status === status).length }), { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 }); }, [applicationsQuery.data]);
  const questions = questionsQuery.data ?? [];
  function toggleTag(tag: string) { setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]); }
  return <ApplicationShell navigation={<ApplicationNavigation activeDestination="questions" accountMenu={<UserButton />} isAddDisabled onAddApplication={() => {}} stageCounts={stageCounts} />}>
    <div className="relative min-h-screen overflow-hidden bg-canvas pb-12 text-ink"><WorkspaceEngineeringGrid /><div className="relative z-10"><header className="flex h-16 items-center gap-3 border-b border-line/80 bg-canvas/85 px-4 backdrop-blur-sm sm:px-6 lg:px-8"><AnimatedSidebarTrigger aria-label="Toggle sidebar" title="Toggle sidebar" className="hidden text-muted transition-colors hover:bg-hover hover:text-ink md:inline-flex"><PanelLeft aria-hidden="true" className="size-4" /></AnimatedSidebarTrigger><p className="text-sm font-medium text-ink">Question bank</p></header>
      <main className="mx-auto max-w-[72rem] px-4 pt-10 sm:px-6 lg:px-8 md:pt-14"><TextReveal as="h1" className="text-4xl font-semibold tracking-tight text-ink" delay={0.15} text="Question bank" /><TextReveal as="p" className="mt-3 max-w-2xl text-sm leading-6 text-muted" delay={0.52} stagger={0.025} text="Review questions you have encountered across every interview round." />
        <div className="mt-8 flex flex-col gap-3 md:flex-row"><input aria-label="Search questions" className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink" placeholder="Search questions or answer notes" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} /><button type="button" className="h-10 rounded-lg border border-line px-3 text-xs text-muted hover:bg-hover" onClick={() => { setSearchInput(""); setSelectedTags([]); }}>Clear filters</button></div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Question tags">{tagsQuery.data?.map((tag) => <button type="button" key={tag} aria-pressed={selectedTags.includes(tag)} className={`rounded-full border px-3 py-1 text-xs ${selectedTags.includes(tag) ? "border-focus bg-focus/15 text-ink" : "border-line text-muted hover:bg-hover"}`} onClick={() => toggleTag(tag)}>{tag}</button>)}</div>
        {questionsQuery.isPending ? <p className="mt-8 text-sm text-muted" role="status">Loading questions…</p> : null}{questionsQuery.isError ? <p className="mt-8 text-sm text-danger" role="alert">Could not load question bank. Please try again.</p> : null}{!questionsQuery.isPending && !questionsQuery.isError && questions.length === 0 ? <p className="mt-8 rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No questions match these filters.</p> : null}
        <div className="mt-8 space-y-3">{questions.map((question) => <article key={question.id} className="rounded-xl border border-line bg-surface p-5"><p className="text-base font-medium text-ink">{question.question_text}</p>{question.my_answer_notes ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{question.my_answer_notes}</p> : null}<div className="mt-3 flex flex-wrap gap-2">{question.tags.map((tag) => <span key={tag} className="rounded-full bg-hover px-2 py-1 text-xs text-muted">{tag}</span>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"><p className="text-xs text-muted">{question.company} · {question.position} · {question.round_label}</p><button type="button" className="text-xs font-semibold text-focus hover:underline" onClick={() => void navigate({ to: "/", search: { applicationId: question.job_application_id } })}>Open application</button></div></article>)}</div>
      </main></div></div>
  </ApplicationShell>;
}
