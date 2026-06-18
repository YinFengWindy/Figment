import { db } from "@/lib/db";
import { listLibraryItems } from "@/lib/repositories/library";
import { getRoom } from "@/lib/repositories/rooms";

export async function getRoomBootstrap(roomId: string) {
  const [room, libraryItems, thread, canvasNodes, canvasEdges] = await Promise.all([
    getRoom(db, roomId),
    listLibraryItems(db, roomId),
    db.threadMessage.findMany({ where: { roomId }, orderBy: { createdAt: "asc" } }),
    db.canvasNode.findMany({ where: { roomId }, orderBy: { createdAt: "asc" } }),
    db.canvasEdge.findMany({ where: { roomId }, orderBy: { createdAt: "asc" } })
  ]);

  return { room, libraryItems, thread, canvasNodes, canvasEdges };
}
