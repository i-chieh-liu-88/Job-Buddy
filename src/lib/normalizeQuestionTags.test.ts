import { describe, expect, it } from "vitest";
import { normalizeQuestionTags } from "./normalizeQuestionTags";

describe("normalizeQuestionTags", () => {
  it("trims, lowercases, removes blanks, and deduplicates", () => {
    expect(normalizeQuestionTags([" Behavioral ", "technical", "BEHAVIORAL", "", "  "])).toEqual(["behavioral", "technical"]);
  });
});
