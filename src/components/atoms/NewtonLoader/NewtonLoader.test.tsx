import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewtonLoader } from "./NewtonLoader";

describe("NewtonLoader", () => {
  it("renders five 64px-scaled balls without a visible caption", () => {
    render(<NewtonLoader label="Entering workspace" />);

    expect(screen.getByRole("status")).toHaveAccessibleName("Entering workspace");
    expect(screen.getAllByTestId("newton-loader-ball")).toHaveLength(5);
    expect(screen.getByTestId("newton-loader-balls")).toHaveStyle({
      height: "12.8px",
    });
    expect(screen.getAllByTestId("newton-loader-ball")[0]).toHaveStyle({
      width: "12.8px",
      height: "12.8px",
    });
    expect(screen.queryByText("Entering workspace")).not.toBeInTheDocument();
  });

  it("scales its ball geometry from the supplied size", () => {
    render(<NewtonLoader size={40} />);

    expect(screen.getByTestId("newton-loader-balls")).toHaveStyle({ height: "8px" });
    expect(screen.getAllByTestId("newton-loader-ball")[0]).toHaveStyle({
      width: "8px",
      height: "8px",
    });
  });
});
