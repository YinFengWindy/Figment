import { executeGeneration } from "@/lib/generation/execute-generation";
import { createPlanSummary, generateImage } from "@/lib/openai/client";

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  const body = await request.json();

  const result = await executeGeneration(
    { createPlanSummary, generateImage },
    {
      roomId,
      prompt: body.prompt,
      plan: body.plan
    }
  );

  return Response.json({ result }, { status: 201 });
}
