import { describe, expect, it } from "vitest";
import { shouldRequirePlanCard } from "@/lib/generation/plan-policy";
import { extractMentionTitles } from "@/lib/thread/mentions";

describe("extractMentionTitles", () => {
  it("returns titles from @mentions", () => {
    expect(extractMentionTitles("@Phoebe @Jubi convenience store fight")).toEqual(["Phoebe", "Jubi"]);
  });
});

describe("shouldRequirePlanCard", () => {
  it("requires confirmation for ambiguous references", () => {
    expect(
      shouldRequirePlanCard({
        mentionedItems: [],
        selectedNodeCount: 0,
        prompt: "draw them together",
        riskyEdit: false
      })
    ).toBe(true);
  });
});
