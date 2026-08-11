import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import type {
  JobApplicationInsert,
  JobApplicationUpdate,
} from "../types/database";

const jobApplicationKeys = {
  all: ["job-applications"] as const,
  list: (userId: string) => [...jobApplicationKeys.all, userId] as const,
};

export type CreateJobApplicationInput = Omit<
  JobApplicationInsert,
  "user_id"
>;

export type UpdateJobApplicationInput = JobApplicationUpdate & {
  id: string;
};

export function useJobApplications() {
  const { isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: jobApplicationKeys.list(userId ?? "signed-out"),
    enabled: isLoaded && Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("status")
        .order("order_index")
        .order("created_at");

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateJobApplication() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateJobApplicationInput) => {
      if (!userId) throw new Error("You must be signed in to create a card.");

      const { data, error } = await supabase
        .from("job_applications")
        .insert({ ...input, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobApplicationKeys.list(userId ?? "signed-out"),
      });
    },
  });
}

export function useUpdateJobApplication() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateJobApplicationInput) => {
      if (!userId) throw new Error("You must be signed in to update a card.");

      const { data, error } = await supabase
        .from("job_applications")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobApplicationKeys.list(userId ?? "signed-out"),
      });
    },
  });
}

export function useDeleteJobApplication() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("You must be signed in to delete a card.");

      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobApplicationKeys.list(userId ?? "signed-out"),
      });
    },
  });
}
