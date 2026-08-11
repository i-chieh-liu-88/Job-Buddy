import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KanbanBoardPage } from "./KanbanBoardPage";

const { useJobApplicationsMock } = vi.hoisted(() => ({
  useJobApplicationsMock: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  UserButton: () => <button type="button" aria-label="Account menu" />,
}));

vi.mock("../../hooks/useJobApplications", () => ({
  useJobApplications: useJobApplicationsMock,
  useReorderJobApplications: () => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  }),
}));

describe("KanbanBoardPage", () => {
  beforeEach(() => {
    useJobApplicationsMock.mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isPending: false,
    });
  });

  it("provides the signed-in user with an account menu", () => {
    render(<KanbanBoardPage />);

    expect(
      screen.getByRole("heading", { name: "Applications" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Account menu" })).toBeVisible();
  });

  it("shows allow-listed query error details during development", () => {
    useJobApplicationsMock.mockReturnValue({
      data: undefined,
      error: {
        authorization: "Bearer must-not-render",
        code: "PGRST301",
        message: "JWT verification failed",
        name: "PostgrestError",
      },
      isError: true,
      isPending: false,
    });

    render(<KanbanBoardPage />);

    expect(
      screen.getByText("Could not load applications. Please try again."),
    ).toBeVisible();
    expect(screen.getByText(/PostgrestError/)).toHaveTextContent("PGRST301");
    expect(screen.getByText(/PostgrestError/)).toHaveTextContent(
      "JWT verification failed",
    );
    expect(screen.queryByText(/must-not-render/)).not.toBeInTheDocument();
  });
});
