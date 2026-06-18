import type { Edge, Node } from "reactflow";

const manualAllowed = new Set(["reference", "variant_of", "rejected"]);

export function canCreateManualEdge(relation: string) {
  return manualAllowed.has(relation);
}

export function buildCanvasGraph(
  canvasNodes: Array<{ id: string; itemId: string; x: number; y: number; width: number; height: number }>,
  libraryItems: Array<{ id: string; title: string; type: string }>,
  canvasEdges: Array<{ id: string; fromNodeId: string; toNodeId: string; relation: string; source: string }>
): { nodes: Node[]; edges: Edge[] } {
  const itemsById = new Map(libraryItems.map((item) => [item.id, item]));

  return {
    nodes: canvasNodes.map((node) => {
      const item = itemsById.get(node.itemId);

      return {
        id: node.id,
        position: { x: node.x, y: node.y },
        width: node.width,
        height: node.height,
        type: "default",
        data: {
          itemId: node.itemId,
          title: item?.title ?? "Untitled",
          itemType: item?.type ?? "unknown"
        }
      };
    }),
    edges: canvasEdges.map((edge) => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      label: `${edge.relation}:${edge.source}`
    }))
  };
}
