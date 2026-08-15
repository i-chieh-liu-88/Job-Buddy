import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import type {
  CompanyResearchInsert,
  InterviewerInsert,
  InterviewerUpdate,
} from "../types/database";

export const companyResearchKeys = {
  all: ["company-research"] as const,
  research: (applicationId: string, userId: string) =>
    [...companyResearchKeys.all, "research", applicationId, userId] as const,
  interviewers: (applicationId: string, userId: string) =>
    [...companyResearchKeys.all, "interviewers", applicationId, userId] as const,
};

type CompanyResearchInput = Omit<
  CompanyResearchInsert,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type CreateInterviewerInput = Omit<
  InterviewerInsert,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type UpdateInterviewerInput = InterviewerUpdate & {
  id: string;
  job_application_id: string;
};

export type DeleteInterviewerInput = {
  id: string;
  jobApplicationId: string;
};

export function useCompanyResearch(applicationId: string) {
  const { isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: companyResearchKeys.research(applicationId, userId ?? "signed-out"),
    enabled: isLoaded && Boolean(userId) && Boolean(applicationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_research")
        .select("*")
        .eq("job_application_id", applicationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useInterviewers(applicationId: string) {
  const { isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: companyResearchKeys.interviewers(applicationId, userId ?? "signed-out"),
    enabled: isLoaded && Boolean(userId) && Boolean(applicationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviewers")
        .select("*")
        .eq("job_application_id", applicationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertCompanyResearch() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompanyResearchInput) => {
      if (!userId) throw new Error("You must be signed in to save company research.");
      const { data, error } = await supabase
        .from("company_research")
        .upsert({ ...input, user_id: userId }, { onConflict: "job_application_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: companyResearchKeys.research(variables.job_application_id, userId ?? "signed-out"),
      });
    },
  });
}

export function useCreateInterviewer() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInterviewerInput) => {
      if (!userId) throw new Error("You must be signed in to save an interviewer.");
      const { data, error } = await supabase
        .from("interviewers")
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: companyResearchKeys.interviewers(variables.job_application_id, userId ?? "signed-out"),
      });
    },
  });
}

export function useUpdateInterviewer() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateInterviewerInput) => {
      const updateFields = {
        name: input.name,
        role: input.role,
        linkedin_url: input.linkedin_url,
        notes: input.notes,
      };
      const { data, error } = await supabase
        .from("interviewers")
        .update(updateFields)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: companyResearchKeys.interviewers(variables.job_application_id, userId ?? "signed-out"),
      });
    },
  });
}

export function useDeleteInterviewer() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteInterviewerInput) => {
      const { error } = await supabase.from("interviewers").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: companyResearchKeys.interviewers(variables.jobApplicationId, userId ?? "signed-out"),
      });
    },
  });
}
