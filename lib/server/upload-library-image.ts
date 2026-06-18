import { createImageDerivatives } from "@/lib/assets/image-pipeline";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { createLibraryItem } from "@/lib/repositories/library";

export async function uploadLibraryImage(input: {
  roomId: string;
  title: string;
  usage: string;
  bytes: Buffer;
  fileName: string;
  mediaType: string;
}) {
  const derivatives = await createImageDerivatives({
    roomId: input.roomId,
    fileName: input.fileName,
    bytes: input.bytes,
    mediaType: input.mediaType,
    storageRoot: env.FILE_STORAGE_ROOT
  });

  const originalAsset = await db.asset.create({
    data: {
      roomId: input.roomId,
      kind: "original",
      filePath: derivatives.original.filePath,
      publicUrl: derivatives.original.publicUrl,
      mediaType: input.mediaType,
      width: derivatives.original.width,
      height: derivatives.original.height,
      checksum: derivatives.original.checksum
    }
  });

  await db.asset.createMany({
    data: [
      {
        roomId: input.roomId,
        kind: "working",
        filePath: derivatives.working.filePath,
        publicUrl: derivatives.working.publicUrl,
        mediaType: "image/png",
        width: derivatives.working.width,
        height: derivatives.working.height,
        checksum: derivatives.working.checksum
      },
      {
        roomId: input.roomId,
        kind: "thumbnail",
        filePath: derivatives.thumbnail.filePath,
        publicUrl: derivatives.thumbnail.publicUrl,
        mediaType: "image/png",
        width: derivatives.thumbnail.width,
        height: derivatives.thumbnail.height,
        checksum: derivatives.thumbnail.checksum
      }
    ]
  });

  return createLibraryItem(db, {
    roomId: input.roomId,
    type: "image",
    title: input.title,
    metadataJson: { usage: input.usage },
    coverAssetId: originalAsset.id
  });
}
