export function shouldRequirePlanCard(input: {
  mentionedItems: Array<unknown>;
  selectedNodeCount: number;
  prompt: string;
  riskyEdit: boolean;
}) {
  if (input.mentionedItems.length === 0) return true;
  if (input.riskyEdit) return true;
  if (/edit|extend|redraw|repaint/i.test(input.prompt)) return true;
  return false;
}
