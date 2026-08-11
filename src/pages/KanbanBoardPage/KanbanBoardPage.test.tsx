import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KanbanBoardPage } from "./KanbanBoardPage";

vi.mock("@clerk/clerk-react", () => ({
  UserButton: () => <button type="button" aria-label="Account menu" />,
}));

vi.mock("../../hooks/useJobApplications", () => ({
  useJobApplications: () => ({
    data: [],
    isError: false,
    isPending: false,
  }),
  useReorderJobApplications: () => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  }),
}));

describe("KanbanBoardPage", () => {
  it("provides the signed-in user with an account menu", () => {
    render(<KanbanBoardPage />);

    expect(
      screen.getByRole("heading", { name: "Applications" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Account menu" })).toBeVisible();
  });
});
