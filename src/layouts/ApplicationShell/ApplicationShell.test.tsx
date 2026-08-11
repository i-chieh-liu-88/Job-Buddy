import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApplicationShell } from "./ApplicationShell";

describe("ApplicationShell", () => {
  it("places application navigation beside the main workspace", () => {
    render(
      <ApplicationShell
        navigation={<aside aria-label="Test navigation">Navigation</aside>}
      >
        <h1>Applications</h1>
      </ApplicationShell>,
    );

    expect(screen.getByRole("complementary", { name: "Test navigation" })).toBeVisible();
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { name: "Applications" }),
    );
  });
});
