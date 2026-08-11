import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobApplication } from "../types/database";
import { useReorderJobApplications } from "./useJobApplications";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isLoaded: true, userId: "user-1" }),
}));

vi.mock("../lib/supabase", () => ({
  useSupabaseClient: () => ({ rpc }),
}));

function application(id: string, orderIndex: number): JobApplication {
  return {
    id,
    user_id: "user-1",
    company: `Company ${id}`,
    position: `Position ${id}`,
    job_url: null,
    status: "saved",
    applied_date: null,
    notes: null,
    resume_version: null,
    order_index: orderIndex,
    created_at: "2026-08-11T00:00:00.000Z",
    updated_at: "2026-08-11T00:00:00.000Z",
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

describe("useReorderJobApplications", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("writes the reordered applications to the cache before the RPC resolves", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const queryKey = ["job-applications", "user-1"] as const;
    const original = [application("first", 1_000), application("second", 2_000)];
    const optimistic = [
      { ...original[1], order_index: 1_000 },
      { ...original[0], order_index: 2_000 },
    ];
    const request = deferred<{ data: JobApplication[]; error: null }>();
    rpc.mockReturnValue(request.promise);
    queryClient.setQueryData(queryKey, original);

    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useReorderJobApplications(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        applications: optimistic,
        updates: optimistic.map(({ id, order_index, status }) => ({
          id,
          order_index,
          status,
        })),
      });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKey)).toEqual(optimistic);
    });

    request.resolve({ data: optimistic, error: null });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("restores the exact cache snapshot and invalidates after an RPC error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const queryKey = ["job-applications", "user-1"] as const;
    const original = [application("first", 1_000), application("second", 2_000)];
    const optimistic = [
      { ...original[1], order_index: 1_000 },
      { ...original[0], order_index: 2_000 },
    ];
    const request = deferred<{ data: null; error: Error }>();
    rpc.mockReturnValue(request.promise);
    queryClient.setQueryData(queryKey, original);
    const cachedOriginal = queryClient.getQueryData(queryKey);

    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useReorderJobApplications(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        applications: optimistic,
        updates: optimistic.map(({ id, order_index, status }) => ({
          id,
          order_index,
          status,
        })),
      });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKey)).toEqual(optimistic);
    });

    request.resolve({ data: null, error: new Error("reorder failed") });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(queryKey)).toStrictEqual(cachedOriginal);
    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
  });
});
