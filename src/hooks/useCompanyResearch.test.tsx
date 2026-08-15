import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  companyResearchKeys,
  useCompanyResearch,
  useCreateInterviewer,
  useDeleteCompanyResearch,
  useDeleteInterviewer,
  useInterviewers,
  useUpsertCompanyResearch,
  useUpdateInterviewer,
} from "./useCompanyResearch";

const {
  deleteEq,
  eq,
  insert,
  maybeSingle,
  order,
  select,
  single,
  update,
  upsert,
} = vi.hoisted(() => ({
  deleteEq: vi.fn(),
  eq: vi.fn(),
  insert: vi.fn(),
  maybeSingle: vi.fn(),
  order: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isLoaded: true, userId: "user-1" }),
}));

vi.mock("../lib/supabase", () => ({
  useSupabaseClient: () => ({
    from: () => ({
      delete: () => ({ eq: deleteEq }),
      eq,
    insert,
      maybeSingle,
      select,
      update,
      upsert,
    }),
  }),
}));

function wrapperFactory(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function queryClientFactory() {
  return new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
}

describe("company research hooks", () => {
  beforeEach(() => {
    deleteEq.mockReset();
    eq.mockReset();
    insert.mockReset();
    maybeSingle.mockReset();
    order.mockReset();
    select.mockReset();
    single.mockReset();
    update.mockReset();
    upsert.mockReset();
  });

  it("loads research for one application", async () => {
    const queryClient = queryClientFactory();
    select.mockReturnValue({ eq });
    eq.mockReturnValue({ maybeSingle });
    maybeSingle.mockResolvedValue({ data: { id: "research-1" }, error: null });

    const { result } = renderHook(() => useCompanyResearch("application-1"), {
      wrapper: wrapperFactory(queryClient),
    });

    await waitFor(() => expect(result.current.data).toEqual({ id: "research-1" }));
    expect(eq).toHaveBeenCalledWith("job_application_id", "application-1");
  });

  it("upserts owned research and invalidates only that application's research", async () => {
    const queryClient = queryClientFactory();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    upsert.mockReturnValue({ select: () => ({ single }) });
    single.mockResolvedValue({ data: { id: "research-1" }, error: null });

    const { result } = renderHook(() => useUpsertCompanyResearch(), {
      wrapper: wrapperFactory(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        job_application_id: "application-1",
        culture_notes: "Strong engineering culture",
        salary_min: 70000,
        salary_max: 85000,
        salary_currency: "EUR",
        salary_source: "Levels.fyi",
      });
    });

    expect(upsert).toHaveBeenCalledWith({
      user_id: "user-1",
      job_application_id: "application-1",
      culture_notes: "Strong engineering culture",
      salary_min: 70000,
      salary_max: 85000,
      salary_currency: "EUR",
      salary_source: "Levels.fyi",
    }, { onConflict: "job_application_id" });
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: companyResearchKeys.research("application-1", "user-1"),
    }));
  });

  it("deletes an application's research and invalidates only that research query", async () => {
    const queryClient = queryClientFactory();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    deleteEq.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useDeleteCompanyResearch(), {
      wrapper: wrapperFactory(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ applicationId: "application-1" });
    });

    expect(deleteEq).toHaveBeenCalledWith("job_application_id", "application-1");
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: companyResearchKeys.research("application-1", "user-1"),
    }));
  });

  it("loads interviewers in creation order", async () => {
    const queryClient = queryClientFactory();
    select.mockReturnValue({ eq });
    eq.mockReturnValue({ order });
    order.mockResolvedValue({ data: [], error: null });

    renderHook(() => useInterviewers("application-1"), {
      wrapper: wrapperFactory(queryClient),
    });

    await waitFor(() => expect(order).toHaveBeenCalledWith("created_at", { ascending: true }));
  });

  it("creates an owned interviewer", async () => {
    const queryClient = queryClientFactory();
    insert.mockReturnValue({ select: () => ({ single }) });
    single.mockResolvedValue({ data: { id: "interviewer-1" }, error: null });

    const { result } = renderHook(() => useCreateInterviewer(), {
      wrapper: wrapperFactory(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        job_application_id: "application-1",
        name: "Alex Morgan",
        role: "Engineering Manager",
        linkedin_url: "https://linkedin.com/in/alex-morgan",
        notes: "Asked about team rituals",
      });
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      job_application_id: "application-1",
      name: "Alex Morgan",
      role: "Engineering Manager",
      linkedin_url: "https://linkedin.com/in/alex-morgan",
      notes: "Asked about team rituals",
    });
  });

  it("updates and deletes an interviewer by id", async () => {
    const queryClient = queryClientFactory();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    update.mockReturnValue({ eq: () => ({ select: () => ({ single }) }) });
    single.mockResolvedValue({ data: { id: "interviewer-1" }, error: null });
    deleteEq.mockResolvedValue({ error: null });

    const { result: updateResult } = renderHook(() => useUpdateInterviewer(), {
      wrapper: wrapperFactory(queryClient),
    });
    await act(async () => {
      await updateResult.current.mutateAsync({
        id: "interviewer-1",
        job_application_id: "application-1",
        name: "Alex M.",
        role: "Engineering Manager",
        linkedin_url: null,
        notes: null,
      });
    });
    expect(update).toHaveBeenCalledWith({
      name: "Alex M.",
      role: "Engineering Manager",
      linkedin_url: null,
      notes: null,
    });

    const { result: deleteResult } = renderHook(() => useDeleteInterviewer(), {
      wrapper: wrapperFactory(queryClient),
    });
    await act(async () => {
      await deleteResult.current.mutateAsync({ id: "interviewer-1", jobApplicationId: "application-1" });
    });
    expect(deleteEq).toHaveBeenCalledWith("id", "interviewer-1");
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: companyResearchKeys.interviewers("application-1", "user-1"),
    }));
  });
});
