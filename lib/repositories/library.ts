import type { LibraryItemType, Prisma, PrismaClient } from "@prisma/client";

export async function listLibraryItems(prisma: PrismaClient, roomId: string) {
  return prisma.libraryItem.findMany({
    where: { roomId },
    orderBy: { updatedAt: "desc" }
  });
}

export async function createLibraryItem(
  prisma: PrismaClient,
  input: {
    roomId: string;
    type: LibraryItemType;
    title: string;
    description?: string;
    metadataJson?: Prisma.InputJsonValue;
    coverAssetId?: string;
  }
) {
  return prisma.libraryItem.create({
    data: {
      roomId: input.roomId,
      type: input.type,
      title: input.title,
      description: input.description,
      metadataJson: input.metadataJson ?? {},
      coverAssetId: input.coverAssetId
    }
  });
}
