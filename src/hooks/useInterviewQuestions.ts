import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import { normalizeQuestionTags } from "../lib/normalizeQuestionTags";
import type { InterviewQuestion, QuestionBankItem } from "../types/interviewQuestions";

export const interviewQuestionKeys = {
  all: ["interview-questions"] as const,
  interview: (interviewId: string, userId: string) => [...interviewQuestionKeys.all, "interview", interviewId, userId] as const,
  bank: (search: string, tags: string[], userId: string) => [...interviewQuestionKeys.all, "bank", search, tags, userId] as const,
  tags: (userId: string) => [...interviewQuestionKeys.all, "tags", userId] as const,
};

export type CreateInterviewQuestionInput = Omit<InterviewQuestion, "id" | "user_id" | "created_at">;
export type UpdateInterviewQuestionInput = Partial<Pick<InterviewQuestion, "question_text" | "my_answer_notes" | "tags">> & { id: string; interviewId: string };
export type DeleteInterviewQuestionInput = { id: string; interviewId: string };

const questionSelect = "id,user_id,interview_id,question_text,my_answer_notes,tags,created_at";
const bankSelect = "id,user_id,interview_id,question_text,my_answer_notes,tags,created_at,interviews!inner(round_label,scheduled_at,job_applications!inner(company,position))";

export function useQuestionsForInterview(interviewId: string) {
  const { isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();
  return useQuery({
    queryKey: interviewQuestionKeys.interview(interviewId, userId ?? "signed-out"),
    enabled: isLoaded && Boolean(userId) && Boolean(interviewId),
    queryFn: async () => {
      const { data, error } = await supabase.from("interview_questions").select(questionSelect).eq("interview_id", interviewId).order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as InterviewQuestion[];
    },
  });
}

export function useQuestionBank({ search, tags }: { search: string; tags: string[] }) {
  const { isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();
  const normalizedSearch = search.trim();
  const normalizedTags = normalizeQuestionTags(tags);
  return useQuery({
    queryKey: interviewQuestionKeys.bank(normalizedSearch, normalizedTags, userId ?? "signed-out"),
    enabled: isLoaded && Boolean(userId),
    queryFn: async () => {
      let query = supabase.from("interview_questions").select(bankSelect).order("created_at", { ascending: false });
      if (normalizedSearch) query = query.or(`question_text.ilike.%${normalizedSearch}%,my_answer_notes.ilike.%${normalizedSearch}%`);
      if (normalizedTags.length) query = query.overlaps("tags", normalizedTags);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row) => {
        const nested = row as unknown as InterviewQuestion & { interviews: { round_label: string; scheduled_at: string; job_applications: { company: string; position: string } } };
        return { ...nested, company: nested.interviews.job_applications.company, position: nested.interviews.job_applications.position, round_label: nested.interviews.round_label, scheduled_at: nested.interviews.scheduled_at };
      }) as QuestionBankItem[];
    },
  });
}

export function useQuestionBankTags() {
  const { isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();
  return useQuery({
    queryKey: interviewQuestionKeys.tags(userId ?? "signed-out"),
    enabled: isLoaded && Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("interview_questions").select("tags");
      if (error) throw error;
      return normalizeQuestionTags((data ?? []).flatMap((row) => row.tags ?? []));
    },
  });
}

export function useCreateInterviewQuestion() {
  const { userId } = useAuth(); const supabase = useSupabaseClient(); const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInterviewQuestionInput) => {
      if (!userId) throw new Error("You must be signed in to save a question.");
      const { data, error } = await supabase.from("interview_questions").insert({ ...input, user_id: userId, tags: normalizeQuestionTags(input.tags) }).select().single();
      if (error) throw error; return data as unknown as InterviewQuestion;
    },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: interviewQuestionKeys.all }); },
  });
}

export function useUpdateInterviewQuestion() {
  const supabase = useSupabaseClient(); const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, interviewId, ...input }: UpdateInterviewQuestionInput) => {
      void interviewId;
      const { data, error } = await supabase.from("interview_questions").update({ ...input, ...(input.tags ? { tags: normalizeQuestionTags(input.tags) } : {}) }).eq("id", id).select().single();
      if (error) throw error; return data as unknown as InterviewQuestion;
    },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: interviewQuestionKeys.all }); },
  });
}

export function useDeleteInterviewQuestion() {
  const supabase = useSupabaseClient(); const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: DeleteInterviewQuestionInput) => { const { error } = await supabase.from("interview_questions").delete().eq("id", id); if (error) throw error; return id; },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: interviewQuestionKeys.all }); },
  });
}
