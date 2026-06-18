import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_TEXT_MODEL: z.string().min(1),
  OPENAI_IMAGE_MODEL: z.string().min(1),
  FILE_STORAGE_ROOT: z.string().min(1)
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(input);
}

let cachedEnv: AppEnv | null = null;

export const env = new Proxy({} as AppEnv, {
  get(_target, prop: keyof AppEnv) {
    if (cachedEnv === null) {
      cachedEnv = parseEnv(process.env);
    }

    return cachedEnv[prop];
  }
});
