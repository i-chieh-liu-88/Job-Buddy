import type { PropsWithChildren } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthGate } from "./AuthGate";

const { auth } = vi.hoisted(() => ({
  auth: { state: "loading" as "loading" | "signed-out" | "signed-in" },
}));

vi.mock("@clerk/clerk-react", () => ({
  ClerkLoading: ({ children }: PropsWithChildren) =>
    auth.state === "loading" ? children : null,
  ClerkLoaded: ({ children }: PropsWithChildren) =>
    auth.state === "loading" ? null : children,
  SignedIn: ({ children }: PropsWithChildren) =>
    auth.state === "signed-in" ? children : null,
  SignedOut: ({ children }: PropsWithChildren) =>
    auth.state === "signed-out" ? children : null,
  SignInButton: ({ children }: PropsWithChildren) => children,
  SignUpButton: ({ children }: PropsWithChildren) => children,
}));

describe("AuthGate", () => {
  beforeEach(() => {
    auth.state = "loading";
  });

  it("does not mount protected content while Clerk is loading", () => {
    render(
      <AuthGate>
        <p>Protected board</p>
      </AuthGate>,
    );

    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Entering Job Buddy workspace",
    );
    expect(screen.getAllByTestId("newton-loader-ball")).toHaveLength(5);
    expect(screen.getByTestId("newton-loader-balls")).toHaveStyle({
      height: "12.8px",
    });
    expect(
      screen.queryByTestId("ascii-bounce-loader-glyph"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Entering Job Buddy workspace"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Protected board")).not.toBeInTheDocument();
  });

  it("shows modal authentication actions instead of protected content when signed out", () => {
    auth.state = "signed-out";

    render(
      <AuthGate>
        <p>Protected board</p>
      </AuthGate>,
    );

    expect(screen.getByText(/Job Buddy/)).toBeVisible();
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
      "font-display",
    );
    expect(screen.getByTestId("landing-headline-primary")).toHaveClass(
      "bg-clip-text",
    );
    expect(screen.getByTestId("architecture-wave-background")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Organizeevery movewith clarity.",
    );
    expect(screen.getByText(/track every job opportunity/i)).toBeVisible();
    expect(screen.getByText("Track every application")).toBeVisible();
    expect(screen.getByText("Move forward visually")).toBeVisible();
    expect(screen.getByText("Keep details close")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
    expect(screen.queryByText("Protected board")).not.toBeInTheDocument();
  });

  it("mounts protected content only when signed in", () => {
    auth.state = "signed-in";

    render(
      <AuthGate>
        <p>Protected board</p>
      </AuthGate>,
    );

    expect(screen.getByText("Protected board")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create account" }),
    ).not.toBeInTheDocument();
  });
});
