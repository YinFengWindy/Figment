import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writeAssetFile(input: {
  storageRoot: string;
  roomId: string;
  bucket: "original" | "working" | "thumb";
  fileName: string;
  bytes: Buffer;
}) {
  const dir = path.join(input.storageRoot, input.roomId, input.bucket);
  await mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, input.fileName);
  await writeFile(absolutePath, input.bytes);

  return {
    absolutePath,
    filePath: absolutePath.replaceAll("\\", "/"),
    publicUrl: absolutePath.replaceAll("\\", "/")
  };
}
