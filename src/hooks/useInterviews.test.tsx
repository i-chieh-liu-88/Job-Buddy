import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  interviewKeys,
  useCreateInterview,
  useInterviewsForApplication,
  useInterviewsForMonth,
} from "./useInterviews";

const { gte, insert, lt, order, select } = vi.hoisted(() => ({
  gte: vi.fn(),
  insert: vi.fn(),
  lt: vi.fn(),
  order: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isLoaded: true, userId: "user-1" }),
}));

vi.mock("../lib/supabase", () => ({
  useSupabaseClient: () => ({
    from: () => ({ insert, order, select }),
  }),
}));

function wrapperFactory(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("interview hooks", () => {
  beforeEach(() => {
    gte.mockReset();
    insert.mockReset();
    lt.mockReset();
    order.mockReset();
    select.mockReset();
  });

  it("creates an owned interview and invalidates all interview views", async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    insert.mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }) });
    const { result } = renderHook(() => useCreateInterview(), { wrapper: wrapperFactory(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({
        job_application_id: "application-1",
        round_label: "Technical",
        scheduled_at: "2026-08-20T09:00:00.000Z",
        location_or_link: null,
        notes: null,
      });
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1", job_application_id: "application-1", round_label: "Technical",
      scheduled_at: "2026-08-20T09:00:00.000Z", location_or_link: null, notes: null,
    });
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: interviewKeys.all }));
  });

  it("loads an application's interviews in scheduled order", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const eq = vi.fn().mockReturnValue({ order });
    select.mockReturnValue({ eq });
    order.mockResolvedValue({ data: [], error: null });
    renderHook(() => useInterviewsForApplication("application-1"), { wrapper: wrapperFactory(queryClient) });
    await waitFor(() => expect(order).toHaveBeenCalledWith("scheduled_at", { ascending: true }));
  });

  it("loads the selected local month in scheduled order", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const month = new Date(2026, 7, 1);
    const monthStart = new Date(2026, 7, 1).toISOString();
    const nextMonthStart = new Date(2026, 8, 1).toISOString();
    const query = { gte };

    select.mockReturnValue(query);
    gte.mockReturnValue({ lt });
    lt.mockReturnValue({ order });
    order.mockResolvedValue({ data: [], error: null });

    renderHook(() => useInterviewsForMonth(month), { wrapper: wrapperFactory(queryClient) });

    await waitFor(() => {
      expect(gte).toHaveBeenCalledWith("scheduled_at", monthStart);
      expect(lt).toHaveBeenCalledWith("scheduled_at", nextMonthStart);
      expect(order).toHaveBeenCalledWith("scheduled_at", { ascending: true });
    });
  });
});
