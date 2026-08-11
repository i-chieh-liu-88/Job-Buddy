import { describe, expect, it } from "vitest";
import {
  JOB_APPLICATION_STATUS_ORDER,
  JOB_APPLICATION_STATUS_PRESENTATION,
} from "./jobApplicationStatusPresentation";

describe("job application status presentation", () => {
  it("defines every stage in workflow order with a visible label and accent", () => {
    expect(JOB_APPLICATION_STATUS_ORDER).toEqual([
      "saved",
      "applied",
      "interview",
      "offer",
      "rejected",
    ]);
    expect(
      JOB_APPLICATION_STATUS_ORDER.map(
        (status) => JOB_APPLICATION_STATUS_PRESENTATION[status].label,
      ),
    ).toEqual(["Saved", "Applied", "Interview", "Offer", "Rejected"]);
    expect(
      JOB_APPLICATION_STATUS_ORDER.every(
        (status) =>
          JOB_APPLICATION_STATUS_PRESENTATION[status].indicatorClassName
            .length > 0,
      ),
    ).toBe(true);
  });
});
