import { createRoomFromRequest } from "@/lib/server/create-room";

export async function POST(request: Request) {
  const body = await request.json();
  const room = await createRoomFromRequest({ name: body.name });

  return Response.json({ room }, { status: 201 });
}
