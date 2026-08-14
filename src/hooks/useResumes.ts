import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import type { Resume } from "../types/database";

export const RESUME_BUCKET = "resumes";
export const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_RESUME_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const resumeKeys = {
  all: ["resumes"] as const,
  list: (userId: string) => [...resumeKeys.all, userId] as const,
};

export type UploadResumeInput = {
  file: File;
  label: string;
};

export type DeleteResumeInput = Pick<Resume, "file_path" | "id">;

export type OpenResumeInput = Pick<Resume, "file_path">;

function safeResumeFileName(filename: string) {
  const extension = filename.includes(".")
    ? `.${filename.split(".").at(-1)?.toLowerCase()}`
    : "";
  const basename = extension ? filename.slice(0, -extension.length) : filename;
  const safeBasename = basename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeBasename || "resume"}${extension}`;
}

export function buildResumeStoragePath(
  userId: string,
  resumeId: string,
  filename: string,
) {
  return `${userId}/${resumeId}/${safeResumeFileName(filename)}`;
}

export function useResumes() {
  const { isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: resumeKeys.list(userId ?? "signed-out"),
    enabled: isLoaded && Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useUploadResume() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, label }: UploadResumeInput) => {
      if (!userId) throw new Error("You must be signed in to upload a resume.");

      const id = crypto.randomUUID();
      const filePath = buildResumeStoragePath(userId, id, file.name);
      const { error: uploadError } = await supabase.storage
        .from(RESUME_BUCKET)
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("resumes")
        .insert({
          id,
          user_id: userId,
          label: label.trim(),
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from(RESUME_BUCKET).remove([filePath]);
        throw insertError;
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: resumeKeys.list(userId ?? "signed-out"),
      });
    },
  });
}

export function useDeleteResume() {
  const { userId } = useAuth();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file_path }: DeleteResumeInput) => {
      if (!userId) throw new Error("You must be signed in to delete a resume.");

      const { error: storageError } = await supabase.storage
        .from(RESUME_BUCKET)
        .remove([file_path]);
      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from("resumes")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;

      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: resumeKeys.list(userId ?? "signed-out"),
      });
    },
  });
}

export function useOpenResume() {
  const supabase = useSupabaseClient();

  return useMutation({
    mutationFn: async ({ file_path }: OpenResumeInput) => {
      const openedWindow = window.open("", "_blank");
      if (!openedWindow) {
        throw new Error("Unable to open a new tab. Please allow popups and try again.");
      }
      openedWindow.opener = null;

      const { data, error } = await supabase.storage
        .from(RESUME_BUCKET)
        .createSignedUrl(file_path, 60);

      if (error || !data?.signedUrl) {
        openedWindow.close();
        throw error ?? new Error("Unable to create a signed resume URL.");
      }

      openedWindow.location.assign(data.signedUrl);
    },
  });
}
