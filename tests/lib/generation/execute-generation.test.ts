import { describe, expect, it, vi } from "vitest";
import { executeGeneration } from "@/lib/generation/execute-generation";

describe("executeGeneration", () => {
  it("creates a generation run summary from planner and image output", async () => {
    const deps = {
      createPlanSummary: vi.fn().mockResolvedValue({ prompt: "phoebe and jubi", model: "gpt-5" }),
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("fake-image"),
        mediaType: "image/png",
        width: 1024,
        height: 1024
      }),
      persistResult: vi.fn().mockResolvedValue({ generationItemId: "item_gen_1", nodeId: "node_1" })
    };

    const result = await executeGeneration(deps as never, {
      roomId: "room_1",
      prompt: "@Phoebe @Jubi convenience store fight",
      plan: { subjectItems: ["char_1", "char_2"] }
    });

    expect(deps.generateImage).toHaveBeenCalled();
    expect(result.generationItemId).toBe("item_gen_1");
  });
});
