import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { createImageDerivatives } from "@/lib/assets/image-pipeline";

describe("createImageDerivatives", () => {
  it("creates original, working, and thumbnail files", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "figment-assets-"));
    const onePixelPng = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .png()
      .toBuffer();

    const result = await createImageDerivatives({
      roomId: "room_1",
      fileName: "phoebe.png",
      bytes: onePixelPng,
      mediaType: "image/png",
      storageRoot: root
    });

    expect(result.original.filePath).toContain("original");
    expect(result.working.filePath).toContain("working");
    expect(result.thumbnail.filePath).toContain("thumb");
    expect((await readFile(result.original.absolutePath)).byteLength).toBeGreaterThan(0);
  });
});
