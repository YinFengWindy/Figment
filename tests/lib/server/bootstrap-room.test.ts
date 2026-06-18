import { describe, expect, it } from "vitest";
import { getRoomBootstrap } from "@/lib/server/bootstrap-room";

describe("getRoomBootstrap", () => {
  it("returns demo room fallback without DB dependency", async () => {
    const result = await getRoomBootstrap("demo-room");

    expect(result.room.id).toBe("demo-room");
    expect(result.libraryItems).toEqual([]);
    expect(result.canvasNodes).toEqual([]);
  });
});
