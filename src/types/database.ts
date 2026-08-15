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
  resume_id: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type Resume = {
  id: string;
  user_id: string;
  label: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
};

export type ResumeInsert = Omit<Resume, "id" | "uploaded_at"> & {
  id?: string;
  uploaded_at?: string;
};

export type ResumeUpdate = Partial<
  Omit<Resume, "id" | "user_id" | "uploaded_at">
>;

export type Interview = {
  id: string;
  user_id: string;
  job_application_id: string;
  round_label: string;
  scheduled_at: string;
  location_or_link: string | null;
  notes: string | null;
  created_at: string;
};

export type InterviewInsert = Omit<Interview, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type InterviewUpdate = Partial<
  Omit<Interview, "id" | "user_id" | "job_application_id" | "created_at">
>;

export type CompanyResearch = {
  id: string;
  user_id: string;
  job_application_id: string;
  culture_notes: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_source: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyResearchInsert = Omit<CompanyResearch, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CompanyResearchUpdate = Partial<
  Omit<CompanyResearch, "id" | "user_id" | "job_application_id" | "created_at" | "updated_at">
>;

export type Interviewer = {
  id: string;
  user_id: string;
  job_application_id: string;
  name: string;
  role: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InterviewerInsert = Omit<Interviewer, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type InterviewerUpdate = Partial<
  Omit<Interviewer, "id" | "user_id" | "job_application_id" | "created_at" | "updated_at">
>;

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
      resumes: {
        Row: Resume;
        Insert: ResumeInsert;
        Update: ResumeUpdate;
        Relationships: [];
      };
      interviews: {
        Row: Interview;
        Insert: InterviewInsert;
        Update: InterviewUpdate;
        Relationships: [];
      };
      company_research: {
        Row: CompanyResearch;
        Insert: CompanyResearchInsert;
        Update: CompanyResearchUpdate;
        Relationships: [];
      };
      interviewers: {
        Row: Interviewer;
        Insert: InterviewerInsert;
        Update: InterviewerUpdate;
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
