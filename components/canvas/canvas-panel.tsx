import React from "react";
import { FigmentCanvas } from "@/components/canvas/figment-canvas";

type CanvasPanelProps = {
  libraryItems: Array<{ id: string; title: string; type: string }>;
  canvasNodes: Array<{ id: string; itemId: string; x: number; y: number; width: number; height: number }>;
  canvasEdges: Array<{ id: string; fromNodeId: string; toNodeId: string; relation: string; source: string }>;
};

export function CanvasPanel(props: CanvasPanelProps) {
  return (
    <section className="pane canvasPane">
      <header className="paneHeader">
        <h2>Canvas</h2>
      </header>
      <div className="paneBody canvasStage">
        <FigmentCanvas {...props} />
      </div>
    </section>
  );
}
