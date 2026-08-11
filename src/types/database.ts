export type JobApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type JobApplication = {
  id: string;
  user_id: string;
  company: string;
  position: string;
  job_url: string | null;
  status: JobApplicationStatus;
  applied_date: string | null;
  notes: string | null;
  resume_version: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type JobApplicationInsert = Omit<
  JobApplication,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  status?: JobApplicationStatus;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
};

export type JobApplicationUpdate = Partial<
  Omit<JobApplication, "id" | "user_id" | "created_at" | "updated_at">
>;

export type Database = {
  public: {
    Tables: {
      job_applications: {
        Row: JobApplication;
        Insert: JobApplicationInsert;
        Update: JobApplicationUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      reorder_job_applications: {
        Args: { p_updates: Json };
        Returns: JobApplication[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
