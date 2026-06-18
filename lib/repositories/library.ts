import type { LibraryItemType, PrismaClient } from "@prisma/client";

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
    metadataJson?: Record<string, unknown>;
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
