import { createImageDerivatives } from "@/lib/assets/image-pipeline";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

type ExecuteDeps = {
  createPlanSummary: (prompt: string) => Promise<{ prompt: string; model: string }>;
  generateImage: (prompt: string) => Promise<{ bytes: Buffer; mediaType: string; width: number; height: number }>;
  persistResult?: typeof persistResult;
};

async function persistResult(input: {
  roomId: string;
  prompt: string;
  plan: Record<string, unknown>;
  output: { bytes: Buffer; mediaType: string };
  model: string;
}) {
  const derivatives = await createImageDerivatives({
    roomId: input.roomId,
    fileName: `generation-${Date.now()}.png`,
    bytes: input.output.bytes,
    mediaType: input.output.mediaType,
    storageRoot: env.FILE_STORAGE_ROOT
  });

  const outputAsset = await db.asset.create({
    data: {
      roomId: input.roomId,
      kind: "generation",
      filePath: derivatives.working.filePath,
      publicUrl: derivatives.working.publicUrl,
      mediaType: input.output.mediaType,
      width: derivatives.working.width,
      height: derivatives.working.height,
      checksum: derivatives.working.checksum
    }
  });

  const item = await db.libraryItem.create({
    data: {
      roomId: input.roomId,
      type: "generation",
      title: "Generation Result",
      metadataJson: {},
      coverAssetId: outputAsset.id
    }
  });

  const node = await db.canvasNode.create({
    data: {
      roomId: input.roomId,
      itemId: item.id,
      x: 640,
      y: 200,
      width: 320,
      height: 320
    }
  });

  await db.generationRun.create({
    data: {
      roomId: input.roomId,
      planJson: input.plan,
      prompt: input.prompt,
      inputItemIdsJson: [],
      outputAssetId: outputAsset.id,
      outputItemId: item.id,
      status: "succeeded",
      modelSnapshotJson: { textModel: input.model }
    }
  });

  return {
    generationItemId: item.id,
    nodeId: node.id
  };
}

export async function executeGeneration(
  deps: ExecuteDeps,
  input: {
    roomId: string;
    prompt: string;
    plan: Record<string, unknown>;
  }
) {
  const summary = await deps.createPlanSummary(input.prompt);
  const output = await deps.generateImage(summary.prompt);
  const save = deps.persistResult ?? persistResult;

  return save({
    roomId: input.roomId,
    prompt: summary.prompt,
    plan: input.plan,
    output,
    model: summary.model
  });
}
