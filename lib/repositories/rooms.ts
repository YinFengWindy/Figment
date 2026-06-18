import type { PrismaClient } from "@prisma/client";

const defaultRoomSettings = {
  planCardMode: "smart",
  defaultStyleItemId: null
};

export async function createRoom(prisma: PrismaClient, name: string) {
  return prisma.room.create({
    data: {
      name,
      settingsJson: defaultRoomSettings
    }
  });
}

export async function listRooms(prisma: PrismaClient) {
  return prisma.room.findMany({
    orderBy: { updatedAt: "desc" }
  });
}

export async function getRoom(prisma: PrismaClient, roomId: string) {
  return prisma.room.findUniqueOrThrow({
    where: { id: roomId }
  });
}
