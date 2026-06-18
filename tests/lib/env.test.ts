import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("throws when OPENAI_API_KEY is missing", () => {
    expect(() =>
      parseEnv({
        DATABASE_URL: "postgresql://figment:figment@localhost:5432/figment",
        OPENAI_API_KEY: "",
        OPENAI_TEXT_MODEL: "gpt-5",
        OPENAI_IMAGE_MODEL: "gpt-image-1",
        FILE_STORAGE_ROOT: "public/uploads"
      })
    ).toThrow("OPENAI_API_KEY");
  });
});
