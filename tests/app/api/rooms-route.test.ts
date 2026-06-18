import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/rooms/route";

vi.mock("@/lib/server/create-room", () => ({
  createRoomFromRequest: vi.fn().mockResolvedValue({
    id: "room_1",
    name: "My Room"
  })
}));

describe("POST /api/rooms", () => {
  it("returns created room JSON", async () => {
    const request = new Request("http://localhost/api/rooms", {
      method: "POST",
      body: JSON.stringify({ name: "My Room" }),
      headers: { "content-type": "application/json" }
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.room.id).toBe("room_1");
  });
});
