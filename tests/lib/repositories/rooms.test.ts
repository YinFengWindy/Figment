import { describe, expect, it, vi } from "vitest";
import { createRoom } from "@/lib/repositories/rooms";

const prisma = {
  room: {
    create: vi.fn()
  }
};

describe("createRoom", () => {
  it("creates a room with default settings", async () => {
    prisma.room.create.mockResolvedValue({
      id: "room_1",
      name: "First Room",
      settingsJson: { planCardMode: "smart" }
    });

    const result = await createRoom(prisma as never, "First Room");

    expect(prisma.room.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "First Room"
        })
      })
    );
    expect(result.settingsJson.planCardMode).toBe("smart");
  });
});
