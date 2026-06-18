import { db } from "@/lib/db";
import { shouldRequirePlanCard } from "@/lib/generation/plan-policy";
import { extractMentionTitles } from "@/lib/thread/mentions";

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  const body = await request.json();
  const mentionTitles = extractMentionTitles(body.prompt);
  const mentionedItems = await db.libraryItem.findMany({
    where: {
      roomId,
      title: { in: mentionTitles }
    }
  });

  const plan = {
    subjectItems: mentionedItems.map((item) => item.id),
    scene: body.prompt,
    action: body.prompt,
    riskNotes: mentionedItems.length === 0 ? ["No resolved mentions"] : []
  };

  const needsConfirmation = shouldRequirePlanCard({
    mentionedItems,
    selectedNodeCount: body.selectedNodeIds?.length ?? 0,
    prompt: body.prompt,
    riskyEdit: false
  });

  return Response.json({ plan, needsConfirmation });
}
