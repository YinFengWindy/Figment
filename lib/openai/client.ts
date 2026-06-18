import OpenAI from "openai";
import { env } from "@/lib/env";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });
}

export async function createPlanSummary(prompt: string) {
  const response = await getOpenAIClient().responses.create({
    model: env.OPENAI_TEXT_MODEL,
    input: `Summarize this image generation request into a concise execution prompt:\n${prompt}`
  });

  return {
    prompt: response.output_text,
    model: env.OPENAI_TEXT_MODEL
  };
}

export async function generateImage(prompt: string) {
  const image = await getOpenAIClient().images.generate({
    model: env.OPENAI_IMAGE_MODEL,
    prompt,
    size: "1024x1024"
  });

  const base64 = image.data?.[0]?.b64_json ?? "";
  return {
    bytes: Buffer.from(base64, "base64"),
    mediaType: "image/png",
    width: 1024,
    height: 1024
  };
}
