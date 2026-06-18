import { canCreateManualEdge } from "@/lib/canvas/graph";
import { db } from "@/lib/db";

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  const body = await request.json();

  if (!canCreateManualEdge(body.relation)) {
    return Response.json({ error: "Invalid manual relation" }, { status: 400 });
  }

  const edge = await db.canvasEdge.create({
    data: {
      roomId,
      fromNodeId: body.fromNodeId,
      toNodeId: body.toNodeId,
      relation: body.relation,
      source: "manual"
    }
  });

  return Response.json({ edge }, { status: 201 });
}
