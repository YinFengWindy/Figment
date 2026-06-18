import type { PrismaClient, ThreadRole } from "@prisma/client";

export async function createThreadMessage(
  prisma: PrismaClient,
  input: {
    roomId: string;
    role: ThreadRole;
    content: string;
    mentionedItemIds: string[];
    selectedNodeIds: string[];
    linkedGenerationItemId?: string;
  }
) {
  return prisma.threadMessage.create({
    data: {
      roomId: input.roomId,
      role: input.role,
      content: input.content,
      mentionedItemIdsJson: input.mentionedItemIds,
      selectedNodeIdsJson: input.selectedNodeIds,
      linkedGenerationItemId: input.linkedGenerationItemId
    }
  });
}
