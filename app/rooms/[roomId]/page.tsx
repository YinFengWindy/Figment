import { RoomShell } from "@/components/layout/room-shell";
import { getRoomBootstrap } from "@/lib/server/bootstrap-room";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const data = await getRoomBootstrap(roomId);

  return <RoomShell {...data} />;
}
