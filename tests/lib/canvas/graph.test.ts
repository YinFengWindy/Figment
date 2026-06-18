import { describe, expect, it } from "vitest";
import { buildCanvasGraph, canCreateManualEdge } from "@/lib/canvas/graph";

describe("canCreateManualEdge", () => {
  it("blocks manual baseline edges", () => {
    expect(canCreateManualEdge("baseline")).toBe(false);
    expect(canCreateManualEdge("reference")).toBe(true);
  });
});

describe("buildCanvasGraph", () => {
  it("maps DB nodes into React Flow nodes", () => {
    const graph = buildCanvasGraph(
      [{ id: "node_1", itemId: "item_1", x: 10, y: 20, width: 160, height: 220 }],
      [{ id: "item_1", title: "Phoebe", type: "character" }],
      []
    );

    expect(graph.nodes[0].position).toEqual({ x: 10, y: 20 });
    expect(graph.nodes[0].data.title).toBe("Phoebe");
  });
});
