import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import type { InterviewInsert, InterviewUpdate } from "../types/database";

export const interviewKeys = {
  all: ["interviews"] as const,
  application: (applicationId: string, userId: string) =>
    [...interviewKeys.all, "application", applicationId, userId] as const,
  month: (monthStartIso: string, userId: string) =>
    [...interviewKeys.all, "month", monthStartIso, userId] as const,
};

export type CreateInterviewInput = Omit<InterviewInsert, "user_id">;
export type UpdateInterviewInput = InterviewUpdate & { id: string; jobApplicationId: string };
export type DeleteInterviewInput = { id: string; jobApplicationId: string };

function getMonthRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function useInterviewsForMonth(month: Date) {
  const { isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();
  const { startIso, endIso } = getMonthRange(month);

  return useQuery({
    queryKey: interviewKeys.month(startIso, userId ?? "signed-out"),
    enabled: isLoaded && Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .gte("scheduled_at", startIso)
        .lt("scheduled_at", endIso)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useInterviewsForApplication(jobApplicationId: string) {
  const { isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: interviewKeys.application(jobApplicationId, userId ?? "signed-out"),
    enabled: isLoaded && Boolean(userId) && Boolean(jobApplicationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("job_application_id", jobApplicationId)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInterview() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInterviewInput) => {
      if (!userId) throw new Error("You must be signed in to schedule an interview.");
      const { data, error } = await supabase.from("interviews")
        .insert({ ...input, user_id: userId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: interviewKeys.all,
      });
    },
  });
}

export function useUpdateInterview() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateInterviewInput) => {
      const { data, error } = await supabase.from("interviews").update({
        location_or_link: input.location_or_link,
        notes: input.notes,
        round_label: input.round_label,
        scheduled_at: input.scheduled_at,
      }).eq("id", input.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: interviewKeys.all,
      });
    },
  });
}

export function useDeleteInterview() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteInterviewInput) => {
      const { error } = await supabase.from("interviews").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: interviewKeys.all,
      });
    },
  });
}
