import { db } from "@/lib/db";
import { createRoom } from "@/lib/repositories/rooms";

export async function createRoomFromRequest(input: { name: string }) {
  return createRoom(db, input.name.trim());
}
