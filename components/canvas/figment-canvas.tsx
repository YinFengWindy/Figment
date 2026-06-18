"use client";

import React from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import { buildCanvasGraph } from "@/lib/canvas/graph";

type FigmentCanvasProps = {
  libraryItems: Array<{ id: string; title: string; type: string }>;
  canvasNodes: Array<{ id: string; itemId: string; x: number; y: number; width: number; height: number }>;
  canvasEdges: Array<{ id: string; fromNodeId: string; toNodeId: string; relation: string; source: string }>;
};

export function FigmentCanvas(props: FigmentCanvasProps) {
  const graph = buildCanvasGraph(props.canvasNodes, props.libraryItems, props.canvasEdges);

  return <ReactFlow fitView nodes={graph.nodes} edges={graph.edges} />;
}
