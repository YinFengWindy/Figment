import sharp from "sharp";
import { sha256 } from "@/lib/assets/checksum";
import { writeAssetFile } from "@/lib/assets/storage";

type Derivative = {
  absolutePath: string;
  filePath: string;
  publicUrl: string;
  width: number;
  height: number;
  checksum: string;
};

export async function createImageDerivatives(input: {
  roomId: string;
  fileName: string;
  bytes: Buffer;
  mediaType: string;
  storageRoot: string;
}): Promise<{
  original: Derivative;
  working: Derivative;
  thumbnail: Derivative;
}> {
  const originalMeta = await sharp(input.bytes).metadata();
  const originalFile = await writeAssetFile({
    storageRoot: input.storageRoot,
    roomId: input.roomId,
    bucket: "original",
    fileName: input.fileName,
    bytes: input.bytes
  });

  const workingBytes = await sharp(input.bytes)
    .resize({ width: 1536, height: 1536, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const workingMeta = await sharp(workingBytes).metadata();
  const workingFile = await writeAssetFile({
    storageRoot: input.storageRoot,
    roomId: input.roomId,
    bucket: "working",
    fileName: input.fileName.replace(/\.\w+$/, ".png"),
    bytes: workingBytes
  });

  const thumbnailBytes = await sharp(input.bytes)
    .resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const thumbnailMeta = await sharp(thumbnailBytes).metadata();
  const thumbnailFile = await writeAssetFile({
    storageRoot: input.storageRoot,
    roomId: input.roomId,
    bucket: "thumb",
    fileName: input.fileName.replace(/\.\w+$/, ".png"),
    bytes: thumbnailBytes
  });

  return {
    original: {
      ...originalFile,
      width: originalMeta.width ?? 0,
      height: originalMeta.height ?? 0,
      checksum: sha256(input.bytes)
    },
    working: {
      ...workingFile,
      width: workingMeta.width ?? 0,
      height: workingMeta.height ?? 0,
      checksum: sha256(workingBytes)
    },
    thumbnail: {
      ...thumbnailFile,
      width: thumbnailMeta.width ?? 0,
      height: thumbnailMeta.height ?? 0,
      checksum: sha256(thumbnailBytes)
    }
  };
}
