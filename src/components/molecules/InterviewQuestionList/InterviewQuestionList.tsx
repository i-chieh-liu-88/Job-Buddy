import { useState, type KeyboardEvent } from "react";
import { useCreateInterviewQuestion, useDeleteInterviewQuestion, useQuestionsForInterview, useQuestionBankTags, useUpdateInterviewQuestion } from "../../../hooks/useInterviewQuestions";
import { normalizeQuestionTags } from "../../../lib/normalizeQuestionTags";
import type { InterviewQuestion } from "../../../types/interviewQuestions";

type Props = { interviewId: string };
type Draft = { id?: string; question_text: string; my_answer_notes: string; tags: string[] };
const emptyDraft: Draft = { question_text: "", my_answer_notes: "", tags: [] };
const control = "mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink";
const button = "inline-flex h-8 items-center justify-center rounded-md border border-line bg-canvas px-2.5 text-xs font-medium text-ink hover:bg-hover disabled:opacity-50";

function draftFromQuestion(question: InterviewQuestion): Draft {
  return { id: question.id, question_text: question.question_text, my_answer_notes: question.my_answer_notes ?? "", tags: question.tags };
}

export function InterviewQuestionList({ interviewId }: Props) {
  const query = useQuestionsForInterview(interviewId);
  const tagsQuery = useQuestionBankTags();
  const create = useCreateInterviewQuestion(); const update = useUpdateInterviewQuestion(); const remove = useDeleteInterviewQuestion();
  const [draft, setDraft] = useState<Draft>(emptyDraft); const [editing, setEditing] = useState(false); const [tagInput, setTagInput] = useState(""); const [deleteCandidate, setDeleteCandidate] = useState<InterviewQuestion | null>(null); const [error, setError] = useState<string | null>(null);
  const saving = create.isPending || update.isPending;

  function startAdd() { setDraft(emptyDraft); setTagInput(""); setError(null); setDeleteCandidate(null); setEditing(true); }
  function startEdit(question: InterviewQuestion) { setDraft(draftFromQuestion(question)); setTagInput(""); setError(null); setDeleteCandidate(null); setEditing(true); }
  function cancel() { setDraft(emptyDraft); setTagInput(""); setError(null); setEditing(false); }
  function addTag(value: string) { setDraft((current) => ({ ...current, tags: normalizeQuestionTags([...current.tags, value]) })); setTagInput(""); }
  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) { if ((event.key === "Enter" || event.key === ",") && tagInput.trim()) { event.preventDefault(); addTag(tagInput); } }
  async function save() {
    if (!draft.question_text.trim()) { setError("Question text is required."); return; }
    try {
      const payload = { question_text: draft.question_text.trim(), my_answer_notes: draft.my_answer_notes.trim() || null, tags: normalizeQuestionTags(draft.tags) };
      if (draft.id) await update.mutateAsync({ id: draft.id, interviewId, ...payload });
      else await create.mutateAsync({ interview_id: interviewId, ...payload });
      cancel();
    } catch { setError("The question could not be saved. Please try again."); }
  }
  async function confirmDelete() { if (!deleteCandidate) return; try { await remove.mutateAsync({ id: deleteCandidate.id, interviewId }); setDeleteCandidate(null); } catch { setError("The question could not be deleted. Please try again."); } }

  return <div className="mt-4 border-t border-line pt-3" aria-label="Interview questions">
    <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Questions asked</p>{!editing ? <button type="button" className={button} onClick={startAdd}>Add question</button> : null}</div>
    {query.isPending ? <p className="mt-2 text-xs text-muted" role="status">Loading questions…</p> : null}
    {query.isError ? <p className="mt-2 text-xs text-danger" role="alert">Could not load questions.</p> : null}
    {!query.isPending && !query.isError && !query.data?.length ? <p className="mt-2 text-xs text-muted">No questions logged yet.</p> : null}
    <div className="mt-2 space-y-2">{query.data?.map((question) => <article key={question.id} className="rounded-md border border-line bg-canvas p-2.5"><p className="text-sm text-ink">{question.question_text}</p>{question.my_answer_notes ? <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{question.my_answer_notes}</p> : null}<div className="mt-2 flex flex-wrap gap-1">{question.tags.map((tag) => <span key={tag} className="rounded-full bg-hover px-2 py-0.5 text-[11px] text-muted">{tag}</span>)}</div><div className="mt-2 flex gap-2"><button type="button" className={button} onClick={() => startEdit(question)}>Edit question</button><button type="button" className={`${button} text-danger`} onClick={() => setDeleteCandidate(question)}>Delete question</button></div>{deleteCandidate?.id === question.id ? <div className="mt-2 flex gap-2" role="group" aria-label="Delete question confirmation"><button type="button" className={`${button} text-danger`} onClick={() => void confirmDelete()} disabled={remove.isPending}>Confirm delete question</button><button type="button" className={button} onClick={() => setDeleteCandidate(null)}>Cancel delete question</button></div> : null}</article>)}</div>
    {editing ? <div className="mt-3 space-y-2 rounded-md border border-line bg-canvas p-3" role="group" aria-label="Interview question editor"><label className="block text-xs font-medium text-ink" htmlFor={`question-text-${interviewId}`}>Question text</label><textarea id={`question-text-${interviewId}`} className="mt-1 min-h-16 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" value={draft.question_text} disabled={saving} onChange={(e) => setDraft((d) => ({ ...d, question_text: e.target.value }))} /><label className="block text-xs font-medium text-ink" htmlFor={`question-answer-${interviewId}`}>Answer notes</label><textarea id={`question-answer-${interviewId}`} className="mt-1 min-h-16 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" value={draft.my_answer_notes} disabled={saving} onChange={(e) => setDraft((d) => ({ ...d, my_answer_notes: e.target.value }))} /><label className="block text-xs font-medium text-ink" htmlFor={`question-tags-${interviewId}`}>Tags</label><input id={`question-tags-${interviewId}`} className={control} value={tagInput} disabled={saving} placeholder="Type a tag and press Enter" onChange={(e) => setTagInput(e.target.value)} onKeyDown={onTagKeyDown} />{tagsQuery.data?.length ? <div className="flex flex-wrap gap-1">{tagsQuery.data.filter((tag) => !draft.tags.includes(tag)).slice(0, 8).map((tag) => <button type="button" className={button} key={tag} onClick={() => addTag(tag)}>{tag}</button>)}</div> : null}<div className="flex flex-wrap gap-1">{draft.tags.map((tag) => <button type="button" key={tag} className="rounded-full bg-hover px-2 py-0.5 text-xs text-muted" onClick={() => setDraft((d) => ({ ...d, tags: d.tags.filter((item) => item !== tag) }))}>{tag} ×</button>)}</div>{error ? <p className="text-xs text-danger" role="alert">{error}</p> : null}<div className="flex gap-2"><button type="button" className={`${button} bg-primary`} onClick={() => void save()} disabled={saving}>Save question</button><button type="button" className={button} onClick={cancel} disabled={saving}>Cancel question</button></div></div> : null}
  </div>;
}
