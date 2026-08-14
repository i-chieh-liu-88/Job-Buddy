import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildResumeStoragePath,
  useDeleteResume,
  useOpenResume,
  useUploadResume,
} from "./useResumes";

const {
  insert,
  deleteEq,
  storageUpload,
  storageRemove,
  createSignedUrl,
} = vi.hoisted(() => ({
  insert: vi.fn(),
  deleteEq: vi.fn(),
  storageUpload: vi.fn(),
  storageRemove: vi.fn(),
  createSignedUrl: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isLoaded: true, userId: "user-1" }),
}));

vi.mock("../lib/supabase", () => ({
  useSupabaseClient: () => ({
    from: () => ({
      delete: () => ({ eq: deleteEq }),
      insert,
    }),
    storage: {
      from: () => ({
        createSignedUrl,
        remove: storageRemove,
        upload: storageUpload,
      }),
    },
  }),
}));

function wrapperFactory(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("resume storage helpers", () => {
  it("builds a lower-case storage-safe path under the current user", () => {
    expect(buildResumeStoragePath("user_1", "resume-1", "Frontend CV.pdf")).toBe(
      "user_1/resume-1/frontend-cv.pdf",
    );
  });
});

describe("useUploadResume", () => {
  beforeEach(() => {
    insert.mockReset();
    deleteEq.mockReset();
    storageRemove.mockReset();
    storageUpload.mockReset();
    createSignedUrl.mockReset();
    vi.stubGlobal("crypto", { randomUUID: () => "resume-1" });
  });

  it("uploads the file, inserts metadata, and invalidates the user's list", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const file = new File(["resume"], "Frontend CV.pdf", {
      type: "application/pdf",
    });
    storageUpload.mockResolvedValue({ data: { path: "ignored" }, error: null });
    insert.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: { id: "resume-1", label: "Frontend v2" },
            error: null,
          }),
      }),
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUploadResume(), {
      wrapper: wrapperFactory(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ file, label: "Frontend v2" });
    });

    expect(storageUpload).toHaveBeenCalledWith(
      "user-1/resume-1/frontend-cv.pdf",
      file,
      { contentType: "application/pdf", upsert: false },
    );
    expect(insert).toHaveBeenCalledWith({
      file_path: "user-1/resume-1/frontend-cv.pdf",
      file_size: file.size,
      file_type: "application/pdf",
      id: "resume-1",
      label: "Frontend v2",
      user_id: "user-1",
    });
    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["resumes", "user-1"],
      });
    });
  });

  it("removes an uploaded object if the metadata insert fails", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const file = new File(["resume"], "general.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    storageUpload.mockResolvedValue({ data: { path: "ignored" }, error: null });
    insert.mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: new Error("insert failed") }),
      }),
    });
    storageRemove.mockResolvedValue({ data: [], error: null });
    deleteEq.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useUploadResume(), {
      wrapper: wrapperFactory(queryClient),
    });

    await expect(
      result.current.mutateAsync({ file, label: "General v1" }),
    ).rejects.toThrow("insert failed");

    expect(storageRemove).toHaveBeenCalledWith([
      "user-1/resume-1/general.docx",
    ]);
  });
});

describe("useOpenResume", () => {
  it("opens a blank tab immediately and navigates it to a signed private URL", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const assign = vi.fn();
    const close = vi.fn();
    const openedWindow = {
      close,
      location: { assign },
      opener: window,
    } as unknown as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(openedWindow);
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.example/frontend-v2.pdf" },
      error: null,
    });
    const { result } = renderHook(() => useOpenResume(), {
      wrapper: wrapperFactory(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        file_path: "user-1/resume-1/frontend-v2.pdf",
      });
    });

    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(openedWindow.opener).toBeNull();
    expect(createSignedUrl).toHaveBeenCalledWith(
      "user-1/resume-1/frontend-v2.pdf",
      60,
    );
    expect(assign).toHaveBeenCalledWith(
      "https://signed.example/frontend-v2.pdf",
    );
    expect(close).not.toHaveBeenCalled();
  });

  it("closes the blank tab and rejects when a signed URL cannot be created", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const close = vi.fn();
    const openedWindow = {
      close,
      location: { assign: vi.fn() },
    } as unknown as Window;
    vi.spyOn(window, "open").mockReturnValue(openedWindow);
    createSignedUrl.mockResolvedValue({
      data: null,
      error: new Error("signed URL failed"),
    });
    const { result } = renderHook(() => useOpenResume(), {
      wrapper: wrapperFactory(queryClient),
    });

    await expect(
      result.current.mutateAsync({
        file_path: "user-1/resume-1/frontend-v2.pdf",
      }),
    ).rejects.toThrow("signed URL failed");

    expect(close).toHaveBeenCalledOnce();
  });
});

describe("useDeleteResume", () => {
  it("removes the private object before deleting its metadata record", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    storageRemove.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useDeleteResume(), {
      wrapper: wrapperFactory(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "resume-1",
        file_path: "user-1/resume-1/frontend-cv.pdf",
      });
    });

    expect(storageRemove).toHaveBeenCalledWith([
      "user-1/resume-1/frontend-cv.pdf",
    ]);
    expect(deleteEq).toHaveBeenCalledWith("id", "resume-1");
  });
});
