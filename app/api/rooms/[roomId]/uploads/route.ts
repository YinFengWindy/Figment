import { uploadLibraryImage } from "@/lib/server/upload-library-image";

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const item = await uploadLibraryImage({
    roomId,
    title: String(formData.get("title") ?? file.name),
    usage: String(formData.get("usage") ?? "reference"),
    fileName: file.name,
    mediaType: file.type || "image/png",
    bytes
  });

  return Response.json({ item }, { status: 201 });
}
