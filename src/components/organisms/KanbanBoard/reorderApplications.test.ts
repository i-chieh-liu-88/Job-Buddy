import { describe, expect, it } from "vitest";
import type { JobApplication } from "../../../types/database";
import { reorderApplications } from "./reorderApplications";

function application(
  id: string,
  status: JobApplication["status"],
  orderIndex: number,
): JobApplication {
  return {
    id,
    user_id: "user-1",
    company: `Company ${id}`,
    position: `Position ${id}`,
    job_url: null,
    status,
    applied_date: null,
    notes: null,
    resume_id: null,
    order_index: orderIndex,
    created_at: "2026-08-11T00:00:00.000Z",
    updated_at: "2026-08-11T00:00:00.000Z",
  };
}

describe("reorderApplications", () => {
  it("moves a card later within its column and normalizes the order", () => {
    const applications = [
      application("saved-1", "saved", 1_000),
      application("saved-2", "saved", 2_000),
      application("saved-3", "saved", 3_000),
    ];

    const result = reorderApplications(applications, "saved-1", "saved-3");

    expect(
      result?.applications.map(({ id, order_index }) => [id, order_index]),
    ).toEqual([
      ["saved-2", 1_000],
      ["saved-3", 2_000],
      ["saved-1", 3_000],
    ]);
    expect(result?.updates).toEqual([
      { id: "saved-2", status: "saved", order_index: 1_000 },
      { id: "saved-3", status: "saved", order_index: 2_000 },
      { id: "saved-1", status: "saved", order_index: 3_000 },
    ]);
  });

  it("moves a card earlier within its column", () => {
    const applications = [
      application("saved-1", "saved", 1_000),
      application("saved-2", "saved", 2_000),
      application("saved-3", "saved", 3_000),
    ];

    const result = reorderApplications(applications, "saved-3", "saved-1");

    expect(result?.applications.map(({ id }) => id)).toEqual([
      "saved-3",
      "saved-1",
      "saved-2",
    ]);
    expect(result?.updates).toEqual([
      { id: "saved-3", status: "saved", order_index: 1_000 },
      { id: "saved-1", status: "saved", order_index: 2_000 },
      { id: "saved-2", status: "saved", order_index: 3_000 },
    ]);
  });

  it("moves a card into a populated column and normalizes both columns", () => {
    const applications = [
      application("saved-1", "saved", 1_000),
      application("saved-2", "saved", 2_000),
      application("interview-1", "interview", 1_000),
      application("interview-2", "interview", 2_000),
    ];

    const result = reorderApplications(
      applications,
      "saved-1",
      "interview-2",
    );

    expect(
      result?.applications
        .filter(({ status }) => status === "saved")
        .map(({ id, order_index }) => [id, order_index]),
    ).toEqual([["saved-2", 1_000]]);
    expect(
      result?.applications
        .filter(({ status }) => status === "interview")
        .map(({ id, order_index }) => [id, order_index]),
    ).toEqual([
      ["interview-1", 1_000],
      ["saved-1", 2_000],
      ["interview-2", 3_000],
    ]);
    expect(result?.updates).toEqual([
      { id: "saved-2", status: "saved", order_index: 1_000 },
      { id: "saved-1", status: "interview", order_index: 2_000 },
      { id: "interview-2", status: "interview", order_index: 3_000 },
    ]);
  });

  it("appends a card to an empty column", () => {
    const applications = [
      application("saved-1", "saved", 1_000),
      application("saved-2", "saved", 2_000),
    ];

    const result = reorderApplications(
      applications,
      "saved-1",
      "column:offer",
    );

    expect(
      result?.applications
        .filter(({ status }) => status === "offer")
        .map(({ id, order_index }) => [id, order_index]),
    ).toEqual([["saved-1", 1_000]]);
    expect(result?.updates).toEqual([
      { id: "saved-2", status: "saved", order_index: 1_000 },
      { id: "saved-1", status: "offer", order_index: 1_000 },
    ]);
  });

  it("returns null for invalid and unchanged drops", () => {
    const applications = [
      application("saved-1", "saved", 1_000),
      application("saved-2", "saved", 2_000),
    ];

    expect(reorderApplications(applications, "missing", "saved-1")).toBeNull();
    expect(reorderApplications(applications, "saved-1", "missing")).toBeNull();
    expect(reorderApplications(applications, "saved-1", "saved-1")).toBeNull();
    expect(
      reorderApplications(applications, "saved-2", "column:saved"),
    ).toBeNull();
  });
});
