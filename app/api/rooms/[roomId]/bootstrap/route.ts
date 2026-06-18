import { getRoomBootstrap } from "@/lib/server/bootstrap-room";

export async function GET(_request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  const data = await getRoomBootstrap(roomId);

  return Response.json(data);
}
