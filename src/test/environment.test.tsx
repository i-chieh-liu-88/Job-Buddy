import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function TestCounter() {
  const [count, setCount] = useState(0);

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  );
}

describe("React test environment", () => {
  it("renders a component and handles user interaction", async () => {
    const user = userEvent.setup();

    render(<TestCounter />);

    const button = screen.getByRole("button", { name: "Count: 0" });
    expect(button).toBeInTheDocument();

    await user.click(button);

    expect(screen.getByRole("button", { name: "Count: 1" })).toBeInTheDocument();
  });
});
