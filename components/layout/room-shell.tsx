import React from "react";
import { CanvasPanel } from "@/components/canvas/canvas-panel";
import { LibraryPanel } from "@/components/library/library-panel";
import { ThreadPanel } from "@/components/thread/thread-panel";

type RoomShellProps = {
  room: { id: string; name: string };
  libraryItems: Array<{ id: string; title: string; type: string }>;
  canvasNodes: Array<{ id: string; itemId: string; x: number; y: number; width: number; height: number }>;
  canvasEdges: Array<{ id: string; fromNodeId: string; toNodeId: string; relation: string; source: string }>;
  thread: Array<{ id: string; role: string; content: string }>;
};

export function RoomShell(props: RoomShellProps) {
  return (
    <main className="roomShell">
      <header className="topBar">
        <h1>{props.room.name}</h1>
      </header>
      <div className="columns">
        <LibraryPanel items={props.libraryItems} />
        <CanvasPanel
          libraryItems={props.libraryItems}
          canvasNodes={props.canvasNodes}
          canvasEdges={props.canvasEdges}
        />
        <ThreadPanel roomId={props.room.id} messages={props.thread} />
      </div>
    </main>
  );
}
