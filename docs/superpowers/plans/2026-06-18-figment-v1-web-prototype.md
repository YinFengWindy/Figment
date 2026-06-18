# Figment V1 Web Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user Figment Web prototype that supports rooms, a unified library, a React Flow canvas, a thread composer with `@` mentions, OpenAI-backed planning/image generation, and persistence of results back onto the canvas.

**Architecture:** Use a single Next.js App Router application at the repo root. Keep all AI context assembly and persistence on the server, with Prisma + Postgres for structured data and the local filesystem for uploaded/generated images and their derivatives. Use React Flow for the canvas, and keep provenance explicit via `GenerationRun`, `CanvasEdge`, and `ThreadMessage`.

**Tech Stack:** Next.js, React, TypeScript, Prisma, PostgreSQL, React Flow, OpenAI SDK, Sharp, Zod, Vitest, React Testing Library, Playwright

---

## File Structure

**Application root**

- `package.json`: app scripts and dependencies
- `tsconfig.json`: TypeScript config
- `next.config.ts`: Next.js config
- `vitest.config.ts`: Vitest config
- `playwright.config.ts`: browser smoke tests
- `.env.example`: required environment variables
- `.gitignore`: ignore build output, uploads, and secrets

**App Router**

- `app/layout.tsx`: global shell
- `app/page.tsx`: rooms index / create-room entry
- `app/globals.css`: global styles
- `app/rooms/[roomId]/page.tsx`: room screen server entry
- `app/api/**/route.ts`: route handlers for room creation, uploads, planning, execution, and manual edges

**Server domain**

- `lib/env.ts`: environment validation
- `lib/db.ts`: Prisma client singleton
- `lib/repositories/*.ts`: data access helpers
- `lib/server/*.ts`: orchestration services that combine repositories and domain logic
- `lib/assets/*.ts`: local file storage and image derivative helpers
- `lib/canvas/*.ts`: graph building and manual edge rules
- `lib/thread/*.ts`: mention parsing and thread helpers
- `lib/generation/*.ts`: planning/execution policy and OpenAI orchestration
- `lib/openai/*.ts`: SDK adapters

**UI**

- `components/layout/*.tsx`: top-level shell and panes
- `components/library/*.tsx`: library list and cards
- `components/canvas/*.tsx`: React Flow wrapper and node renderers
- `components/thread/*.tsx`: composer, plan card, message list

**Data**

- `prisma/schema.prisma`: core relational schema

**Tests**

- `tests/lib/**/*.test.ts`: unit tests for domain logic
- `tests/components/**/*.test.tsx`: UI rendering tests
- `tests/app/api/**/*.test.ts`: route handler tests
- `tests/e2e/**/*.spec.ts`: Playwright end-to-end smoke tests

### Task 1: Bootstrap the Next.js Workspace and Test Harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `lib/env.ts`
- Create: `tests/setup.ts`
- Create: `tests/lib/env.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/env.test.ts
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
        FILE_STORAGE_ROOT: "public/uploads",
      }),
    ).toThrow("OPENAI_API_KEY");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/lib/env.test.ts`

Expected: FAIL with `Cannot find module '@/lib/env'` or `Missing script: test`

- [ ] **Step 3: Write minimal implementation**

```json
// package.json
{
  "name": "figment",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "next": "^16.0.0",
    "openai": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "reactflow": "^11.11.4",
    "sharp": "^0.34.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^26.0.0",
    "prisma": "^6.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

```ts
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
});
```

```env
// .env.example
DATABASE_URL="postgresql://figment:figment@localhost:5432/figment"
OPENAI_API_KEY="sk-..."
OPENAI_TEXT_MODEL="gpt-5"
OPENAI_IMAGE_MODEL="gpt-image-1"
FILE_STORAGE_ROOT="public/uploads"
```

```gitignore
# .gitignore
node_modules
.next
coverage
playwright-report
test-results
.env
public/uploads
!.gitkeep
```

```ts
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_TEXT_MODEL: z.string().min(1),
  OPENAI_IMAGE_MODEL: z.string().min(1),
  FILE_STORAGE_ROOT: z.string().min(1),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(input);
}

export const env = parseEnv(process.env);
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

```tsx
// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// app/page.tsx
export default function HomePage() {
  return (
    <main className="home">
      <h1>Figment</h1>
      <p>Canvas-first image creation for character-driven workflows.</p>
    </main>
  );
}
```

```css
/* app/globals.css */
:root {
  color-scheme: light;
  --bg: #f4efe7;
  --panel: #fffaf2;
  --ink: #17110f;
  --line: #d9cfc2;
  --accent: #bd5b38;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: radial-gradient(circle at top, #fff6e8 0%, var(--bg) 60%);
  color: var(--ink);
  font-family: "Segoe UI", sans-serif;
}

.home {
  min-height: 100vh;
  display: grid;
  place-items: center;
  gap: 0.75rem;
  text-align: center;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/lib/env.test.ts`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: bootstrap figment web app"
```

### Task 2: Model Core Entities with Prisma and Repositories

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`
- Create: `lib/repositories/rooms.ts`
- Create: `lib/repositories/library.ts`
- Create: `lib/repositories/thread.ts`
- Create: `tests/lib/repositories/rooms.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/repositories/rooms.test.ts
import { describe, expect, it, vi } from "vitest";
import { createRoom } from "@/lib/repositories/rooms";

const prisma = {
  room: {
    create: vi.fn(),
  },
};

describe("createRoom", () => {
  it("creates a room with default settings", async () => {
    prisma.room.create.mockResolvedValue({
      id: "room_1",
      name: "First Room",
      settingsJson: { planCardMode: "smart" },
    });

    const result = await createRoom(prisma as never, "First Room");

    expect(prisma.room.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "First Room",
        }),
      }),
    );
    expect(result.settingsJson.planCardMode).toBe("smart");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/lib/repositories/rooms.test.ts`

Expected: FAIL with `Cannot find module '@/lib/repositories/rooms'`

- [ ] **Step 3: Write minimal implementation**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum LibraryItemType {
  character
  image
  style
  scene
  generation
}

enum CanvasEdgeRelation {
  baseline
  reference
  edit_from
  variant_of
  rejected
}

enum CanvasEdgeSource {
  auto
  manual
}

enum ThreadRole {
  user
  assistant
  system
}

enum GenerationRunStatus {
  pending
  planned
  needs_confirmation
  running
  succeeded
  failed
}

model Room {
  id           String          @id @default(cuid())
  name         String
  settingsJson Json
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  libraryItems LibraryItem[]
  assets       Asset[]
  canvasNodes  CanvasNode[]
  canvasEdges  CanvasEdge[]
  thread       ThreadMessage[]
  runs         GenerationRun[]
}

model LibraryItem {
  id                 String           @id @default(cuid())
  roomId             String
  type               LibraryItemType
  title              String
  description        String?
  metadataJson       Json
  coverAssetId       String?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  room               Room             @relation(fields: [roomId], references: [id], onDelete: Cascade)
  coverAsset         Asset?           @relation("LibraryCoverAsset", fields: [coverAssetId], references: [id])
  assets             Asset[]          @relation("LibraryItemAssets")
  canvasNodes        CanvasNode[]
  outputRuns         GenerationRun[]  @relation("RunOutputItem")
}

model Asset {
  id                    String        @id @default(cuid())
  roomId                String
  kind                  String
  filePath              String
  publicUrl             String
  mediaType             String
  width                 Int
  height                Int
  checksum              String
  createdAt             DateTime      @default(now())
  room                  Room          @relation(fields: [roomId], references: [id], onDelete: Cascade)
  libraryItems          LibraryItem[] @relation("LibraryItemAssets")
  coverForItems         LibraryItem[] @relation("LibraryCoverAsset")
  outputRuns            GenerationRun[] @relation("RunOutputAsset")
}

model CanvasNode {
  id          String      @id @default(cuid())
  roomId      String
  itemId      String
  x           Float
  y           Float
  width       Float
  height      Float
  zIndex      Int         @default(0)
  collapsed   Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  room        Room        @relation(fields: [roomId], references: [id], onDelete: Cascade)
  item        LibraryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
}

model CanvasEdge {
  id          String             @id @default(cuid())
  roomId      String
  fromNodeId  String
  toNodeId    String
  relation    CanvasEdgeRelation
  source      CanvasEdgeSource
  createdAt   DateTime           @default(now())
  room        Room               @relation(fields: [roomId], references: [id], onDelete: Cascade)
}

model ThreadMessage {
  id                     String      @id @default(cuid())
  roomId                 String
  role                   ThreadRole
  content                String
  mentionedItemIdsJson   Json
  selectedNodeIdsJson    Json
  linkedGenerationItemId String?
  createdAt              DateTime    @default(now())
  room                   Room        @relation(fields: [roomId], references: [id], onDelete: Cascade)
}

model GenerationRun {
  id               String              @id @default(cuid())
  roomId           String
  triggerMessageId String?
  planJson         Json
  prompt           String
  inputItemIdsJson Json
  outputAssetId    String?
  outputItemId     String?
  status           GenerationRunStatus
  errorMessage     String?
  modelSnapshotJson Json
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  room             Room                @relation(fields: [roomId], references: [id], onDelete: Cascade)
  outputAsset      Asset?              @relation("RunOutputAsset", fields: [outputAssetId], references: [id])
  outputItem       LibraryItem?        @relation("RunOutputItem", fields: [outputItemId], references: [id])
}
```

```ts
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

```ts
// lib/repositories/rooms.ts
import type { PrismaClient } from "@prisma/client";

const defaultRoomSettings = {
  planCardMode: "smart",
  defaultStyleItemId: null,
};

export async function createRoom(prisma: PrismaClient, name: string) {
  return prisma.room.create({
    data: {
      name,
      settingsJson: defaultRoomSettings,
    },
  });
}

export async function listRooms(prisma: PrismaClient) {
  return prisma.room.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function getRoom(prisma: PrismaClient, roomId: string) {
  return prisma.room.findUniqueOrThrow({
    where: { id: roomId },
  });
}
```

```ts
// lib/repositories/library.ts
import type { LibraryItemType, PrismaClient } from "@prisma/client";

export async function listLibraryItems(prisma: PrismaClient, roomId: string) {
  return prisma.libraryItem.findMany({
    where: { roomId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createLibraryItem(
  prisma: PrismaClient,
  input: {
    roomId: string;
    type: LibraryItemType;
    title: string;
    description?: string;
    metadataJson?: Record<string, unknown>;
    coverAssetId?: string;
  },
) {
  return prisma.libraryItem.create({
    data: {
      roomId: input.roomId,
      type: input.type,
      title: input.title,
      description: input.description,
      metadataJson: input.metadataJson ?? {},
      coverAssetId: input.coverAssetId,
    },
  });
}
```

```ts
// lib/repositories/thread.ts
import type { PrismaClient, ThreadRole } from "@prisma/client";

export async function createThreadMessage(
  prisma: PrismaClient,
  input: {
    roomId: string;
    role: ThreadRole;
    content: string;
    mentionedItemIds: string[];
    selectedNodeIds: string[];
    linkedGenerationItemId?: string;
  },
) {
  return prisma.threadMessage.create({
    data: {
      roomId: input.roomId,
      role: input.role,
      content: input.content,
      mentionedItemIdsJson: input.mentionedItemIds,
      selectedNodeIdsJson: input.selectedNodeIds,
      linkedGenerationItemId: input.linkedGenerationItemId,
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/lib/repositories/rooms.test.ts`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma lib/db.ts lib/repositories tests/lib/repositories/rooms.test.ts
git commit -m "feat: model core figment entities"
```

### Task 3: Implement Local Asset Storage and Image Derivatives

**Files:**
- Create: `lib/assets/storage.ts`
- Create: `lib/assets/image-pipeline.ts`
- Create: `lib/assets/checksum.ts`
- Create: `tests/lib/assets/image-pipeline.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/assets/image-pipeline.test.ts
import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createImageDerivatives } from "@/lib/assets/image-pipeline";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlH0HcAAAAASUVORK5CYII=",
  "base64",
);

describe("createImageDerivatives", () => {
  it("creates original, working, and thumbnail files", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "figment-assets-"));
    const result = await createImageDerivatives({
      roomId: "room_1",
      fileName: "phoebe.png",
      bytes: onePixelPng,
      mediaType: "image/png",
      storageRoot: root,
    });

    expect(result.original.filePath).toContain("original");
    expect(result.working.filePath).toContain("working");
    expect(result.thumbnail.filePath).toContain("thumb");
    expect((await readFile(result.original.absolutePath)).byteLength).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/lib/assets/image-pipeline.test.ts`

Expected: FAIL with `Cannot find module '@/lib/assets/image-pipeline'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/assets/checksum.ts
import { createHash } from "node:crypto";

export function sha256(input: Buffer) {
  return createHash("sha256").update(input).digest("hex");
}
```

```ts
// lib/assets/storage.ts
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

export async function writeAssetFile(input: {
  storageRoot: string;
  roomId: string;
  bucket: "original" | "working" | "thumb";
  fileName: string;
  bytes: Buffer;
}) {
  const dir = path.join(input.storageRoot, input.roomId, input.bucket);
  await mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, input.fileName);
  await writeFile(absolutePath, input.bytes);

  return {
    absolutePath,
    filePath: path.relative(process.cwd(), absolutePath).replaceAll("\\", "/"),
    publicUrl: `/${path.relative("public", absolutePath).replaceAll("\\", "/")}`,
  };
}
```

```ts
// lib/assets/image-pipeline.ts
import sharp from "sharp";
import { sha256 } from "@/lib/assets/checksum";
import { writeAssetFile } from "@/lib/assets/storage";

type Derivative = {
  absolutePath: string;
  filePath: string;
  publicUrl: string;
  width: number;
  height: number;
  checksum: string;
};

export async function createImageDerivatives(input: {
  roomId: string;
  fileName: string;
  bytes: Buffer;
  mediaType: string;
  storageRoot: string;
}): Promise<{
  original: Derivative;
  working: Derivative;
  thumbnail: Derivative;
}> {
  const originalMeta = await sharp(input.bytes).metadata();
  const originalFile = await writeAssetFile({
    storageRoot: input.storageRoot,
    roomId: input.roomId,
    bucket: "original",
    fileName: input.fileName,
    bytes: input.bytes,
  });

  const workingBytes = await sharp(input.bytes)
    .resize({ width: 1536, height: 1536, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const workingMeta = await sharp(workingBytes).metadata();
  const workingFile = await writeAssetFile({
    storageRoot: input.storageRoot,
    roomId: input.roomId,
    bucket: "working",
    fileName: input.fileName.replace(/\.\w+$/, ".png"),
    bytes: workingBytes,
  });

  const thumbnailBytes = await sharp(input.bytes)
    .resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const thumbnailMeta = await sharp(thumbnailBytes).metadata();
  const thumbnailFile = await writeAssetFile({
    storageRoot: input.storageRoot,
    roomId: input.roomId,
    bucket: "thumb",
    fileName: input.fileName.replace(/\.\w+$/, ".png"),
    bytes: thumbnailBytes,
  });

  return {
    original: {
      ...originalFile,
      width: originalMeta.width ?? 0,
      height: originalMeta.height ?? 0,
      checksum: sha256(input.bytes),
    },
    working: {
      ...workingFile,
      width: workingMeta.width ?? 0,
      height: workingMeta.height ?? 0,
      checksum: sha256(workingBytes),
    },
    thumbnail: {
      ...thumbnailFile,
      width: thumbnailMeta.width ?? 0,
      height: thumbnailMeta.height ?? 0,
      checksum: sha256(thumbnailBytes),
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/lib/assets/image-pipeline.test.ts`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/assets tests/lib/assets/image-pipeline.test.ts
git commit -m "feat: add local asset derivative pipeline"
```

### Task 4: Implement Room Bootstrap, Room Creation, and Library Upload Routes

**Files:**
- Create: `lib/server/bootstrap-room.ts`
- Create: `lib/server/create-room.ts`
- Create: `lib/server/upload-library-image.ts`
- Create: `app/api/rooms/route.ts`
- Create: `app/api/rooms/[roomId]/bootstrap/route.ts`
- Create: `app/api/rooms/[roomId]/uploads/route.ts`
- Create: `tests/app/api/rooms-route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/app/api/rooms-route.test.ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/rooms/route";

vi.mock("@/lib/server/create-room", () => ({
  createRoomFromRequest: vi.fn().mockResolvedValue({
    id: "room_1",
    name: "My Room",
  }),
}));

describe("POST /api/rooms", () => {
  it("returns created room JSON", async () => {
    const request = new Request("http://localhost/api/rooms", {
      method: "POST",
      body: JSON.stringify({ name: "My Room" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.room.id).toBe("room_1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/app/api/rooms-route.test.ts`

Expected: FAIL with `Cannot find module '@/app/api/rooms/route'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/server/create-room.ts
import { db } from "@/lib/db";
import { createRoom } from "@/lib/repositories/rooms";

export async function createRoomFromRequest(input: { name: string }) {
  return createRoom(db, input.name.trim());
}
```

```ts
// lib/server/bootstrap-room.ts
import { db } from "@/lib/db";
import { getRoom } from "@/lib/repositories/rooms";
import { listLibraryItems } from "@/lib/repositories/library";

export async function getRoomBootstrap(roomId: string) {
  const [room, libraryItems, thread, canvasNodes, canvasEdges] = await Promise.all([
    getRoom(db, roomId),
    listLibraryItems(db, roomId),
    db.threadMessage.findMany({ where: { roomId }, orderBy: { createdAt: "asc" } }),
    db.canvasNode.findMany({ where: { roomId }, orderBy: { createdAt: "asc" } }),
    db.canvasEdge.findMany({ where: { roomId }, orderBy: { createdAt: "asc" } }),
  ]);

  return { room, libraryItems, thread, canvasNodes, canvasEdges };
}
```

```ts
// lib/server/upload-library-image.ts
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { createImageDerivatives } from "@/lib/assets/image-pipeline";
import { createLibraryItem } from "@/lib/repositories/library";

export async function uploadLibraryImage(input: {
  roomId: string;
  title: string;
  usage: string;
  bytes: Buffer;
  fileName: string;
  mediaType: string;
}) {
  const derivatives = await createImageDerivatives({
    roomId: input.roomId,
    fileName: input.fileName,
    bytes: input.bytes,
    mediaType: input.mediaType,
    storageRoot: env.FILE_STORAGE_ROOT,
  });

  const originalAsset = await db.asset.create({
    data: {
      roomId: input.roomId,
      kind: "original",
      filePath: derivatives.original.filePath,
      publicUrl: derivatives.original.publicUrl,
      mediaType: input.mediaType,
      width: derivatives.original.width,
      height: derivatives.original.height,
      checksum: derivatives.original.checksum,
    },
  });

  await db.asset.createMany({
    data: [
      {
        roomId: input.roomId,
        kind: "working",
        filePath: derivatives.working.filePath,
        publicUrl: derivatives.working.publicUrl,
        mediaType: "image/png",
        width: derivatives.working.width,
        height: derivatives.working.height,
        checksum: derivatives.working.checksum,
      },
      {
        roomId: input.roomId,
        kind: "thumbnail",
        filePath: derivatives.thumbnail.filePath,
        publicUrl: derivatives.thumbnail.publicUrl,
        mediaType: "image/png",
        width: derivatives.thumbnail.width,
        height: derivatives.thumbnail.height,
        checksum: derivatives.thumbnail.checksum,
      },
    ],
  });

  return createLibraryItem(db, {
    roomId: input.roomId,
    type: "image",
    title: input.title,
    metadataJson: { usage: input.usage },
    coverAssetId: originalAsset.id,
  });
}
```

```ts
// app/api/rooms/route.ts
import { createRoomFromRequest } from "@/lib/server/create-room";

export async function POST(request: Request) {
  const body = await request.json();
  const room = await createRoomFromRequest({ name: body.name });

  return Response.json({ room }, { status: 201 });
}
```

```ts
// app/api/rooms/[roomId]/bootstrap/route.ts
import { getRoomBootstrap } from "@/lib/server/bootstrap-room";

export async function GET(_: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  const data = await getRoomBootstrap(roomId);

  return Response.json(data);
}
```

```ts
// app/api/rooms/[roomId]/uploads/route.ts
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
    bytes,
  });

  return Response.json({ item }, { status: 201 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/app/api/rooms-route.test.ts`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/server app/api tests/app/api/rooms-route.test.ts
git commit -m "feat: add room bootstrap and upload routes"
```

### Task 5: Build the Three-Pane Room UI Shell

**Files:**
- Create: `components/layout/room-shell.tsx`
- Create: `components/library/library-panel.tsx`
- Create: `components/canvas/canvas-panel.tsx`
- Create: `components/thread/thread-panel.tsx`
- Create: `app/rooms/[roomId]/page.tsx`
- Create: `tests/components/room-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/room-shell.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomShell } from "@/components/layout/room-shell";

describe("RoomShell", () => {
  it("renders library, canvas, and thread panes", () => {
    render(
      <RoomShell
        room={{ id: "room_1", name: "Phoebe Lab" }}
        libraryItems={[]}
        canvasNodes={[]}
        canvasEdges={[]}
        thread={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Phoebe Lab" })).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Canvas")).toBeInTheDocument();
    expect(screen.getByText("Thread")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/components/room-shell.test.tsx`

Expected: FAIL with `Cannot find module '@/components/layout/room-shell'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/library/library-panel.tsx
type LibraryPanelProps = {
  items: Array<{ id: string; title: string; type: string }>;
};

export function LibraryPanel({ items }: LibraryPanelProps) {
  return (
    <section className="pane">
      <header className="paneHeader">
        <h2>Library</h2>
      </header>
      <div className="paneBody">
        {items.length === 0 ? <p>No library items yet.</p> : items.map((item) => <div key={item.id}>{item.title}</div>)}
      </div>
    </section>
  );
}
```

```tsx
// components/canvas/canvas-panel.tsx
export function CanvasPanel() {
  return (
    <section className="pane canvasPane">
      <header className="paneHeader">
        <h2>Canvas</h2>
      </header>
      <div className="paneBody canvasStage">Canvas graph loads here.</div>
    </section>
  );
}
```

```tsx
// components/thread/thread-panel.tsx
type ThreadPanelProps = {
  messages: Array<{ id: string; role: string; content: string }>;
};

export function ThreadPanel({ messages }: ThreadPanelProps) {
  return (
    <section className="pane">
      <header className="paneHeader">
        <h2>Thread</h2>
      </header>
      <div className="paneBody">
        {messages.length === 0 ? <p>No messages yet.</p> : messages.map((message) => <p key={message.id}>{message.content}</p>)}
      </div>
    </section>
  );
}
```

```tsx
// components/layout/room-shell.tsx
import { LibraryPanel } from "@/components/library/library-panel";
import { CanvasPanel } from "@/components/canvas/canvas-panel";
import { ThreadPanel } from "@/components/thread/thread-panel";

type RoomShellProps = {
  room: { id: string; name: string };
  libraryItems: Array<{ id: string; title: string; type: string }>;
  canvasNodes: Array<unknown>;
  canvasEdges: Array<unknown>;
  thread: Array<{ id: string; role: string; content: string }>;
};

export function RoomShell(props: RoomShellProps) {
  return (
    <main className="roomShell">
      <header className="topBar">
        <h1>{props.room.name}</h1>
      </header>
      <div className="columns">
        <LibraryPanel items={props.libraryItems} />
        <CanvasPanel />
        <ThreadPanel messages={props.thread} />
      </div>
    </main>
  );
}
```

```tsx
// app/rooms/[roomId]/page.tsx
import { getRoomBootstrap } from "@/lib/server/bootstrap-room";
import { RoomShell } from "@/components/layout/room-shell";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const data = await getRoomBootstrap(roomId);

  return <RoomShell {...data} />;
}
```

```css
/* append to app/globals.css */
.roomShell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
}

.topBar {
  border-bottom: 1px solid var(--line);
  background: rgba(255, 250, 242, 0.92);
  padding: 1rem 1.25rem;
  backdrop-filter: blur(18px);
}

.columns {
  display: grid;
  grid-template-columns: 280px 1fr 360px;
  gap: 1px;
  background: var(--line);
}

.pane {
  background: var(--panel);
  min-height: calc(100vh - 73px);
}

.paneHeader {
  padding: 1rem;
  border-bottom: 1px solid var(--line);
}

.paneBody {
  padding: 1rem;
}

.canvasStage {
  min-height: 720px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/components/room-shell.test.tsx`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add components app/rooms/[roomId]/page.tsx app/globals.css tests/components/room-shell.test.tsx
git commit -m "feat: add figment room shell"
```

### Task 6: Add React Flow Graph Rendering and Manual Relation Rules

**Files:**
- Create: `lib/canvas/graph.ts`
- Create: `components/canvas/figment-canvas.tsx`
- Create: `app/api/rooms/[roomId]/edges/route.ts`
- Create: `tests/lib/canvas/graph.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/canvas/graph.test.ts
import { describe, expect, it } from "vitest";
import { canCreateManualEdge, buildCanvasGraph } from "@/lib/canvas/graph";

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
      [],
    );

    expect(graph.nodes[0].position).toEqual({ x: 10, y: 20 });
    expect(graph.nodes[0].data.title).toBe("Phoebe");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/lib/canvas/graph.test.ts`

Expected: FAIL with `Cannot find module '@/lib/canvas/graph'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/canvas/graph.ts
import type { Edge, Node } from "reactflow";

const manualAllowed = new Set(["reference", "variant_of", "rejected"]);

export function canCreateManualEdge(relation: string) {
  return manualAllowed.has(relation);
}

export function buildCanvasGraph(
  canvasNodes: Array<{ id: string; itemId: string; x: number; y: number; width: number; height: number }>,
  libraryItems: Array<{ id: string; title: string; type: string }>,
  canvasEdges: Array<{ id: string; fromNodeId: string; toNodeId: string; relation: string; source: string }>,
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
          itemType: item?.type ?? "unknown",
        },
      };
    }),
    edges: canvasEdges.map((edge) => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      label: `${edge.relation}:${edge.source}`,
    })),
  };
}
```

```tsx
// components/canvas/figment-canvas.tsx
"use client";

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
```

```ts
// app/api/rooms/[roomId]/edges/route.ts
import { db } from "@/lib/db";
import { canCreateManualEdge } from "@/lib/canvas/graph";

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  const body = await request.json();

  if (!canCreateManualEdge(body.relation)) {
    return Response.json({ error: "Invalid manual relation" }, { status: 400 });
  }

  const edge = await db.canvasEdge.create({
    data: {
      roomId,
      fromNodeId: body.fromNodeId,
      toNodeId: body.toNodeId,
      relation: body.relation,
      source: "manual",
    },
  });

  return Response.json({ edge }, { status: 201 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/lib/canvas/graph.test.ts`

Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/canvas components/canvas/figment-canvas.tsx app/api/rooms/[roomId]/edges/route.ts tests/lib/canvas/graph.test.ts
git commit -m "feat: render canvas graph and manual relations"
```

### Task 7: Build the Thread Composer, Mention Parsing, and Planning Policy

**Files:**
- Create: `lib/thread/mentions.ts`
- Create: `lib/generation/plan-policy.ts`
- Create: `components/thread/command-composer.tsx`
- Create: `components/thread/plan-card.tsx`
- Create: `app/api/rooms/[roomId]/generate/plan/route.ts`
- Create: `tests/lib/thread/mentions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/thread/mentions.test.ts
import { describe, expect, it } from "vitest";
import { extractMentionTitles } from "@/lib/thread/mentions";
import { shouldRequirePlanCard } from "@/lib/generation/plan-policy";

describe("extractMentionTitles", () => {
  it("returns titles from @mentions", () => {
    expect(extractMentionTitles("@Phoebe @Jubi convenience store fight")).toEqual(["Phoebe", "Jubi"]);
  });
});

describe("shouldRequirePlanCard", () => {
  it("requires confirmation for ambiguous references", () => {
    expect(
      shouldRequirePlanCard({
        mentionedItems: [],
        selectedNodeCount: 0,
        prompt: "draw them together",
        riskyEdit: false,
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/lib/thread/mentions.test.ts`

Expected: FAIL with `Cannot find module '@/lib/thread/mentions'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/thread/mentions.ts
export function extractMentionTitles(input: string) {
  return Array.from(input.matchAll(/@([^\s@]+)/g), (match) => match[1]);
}
```

```ts
// lib/generation/plan-policy.ts
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
```

```tsx
// components/thread/command-composer.tsx
"use client";

import { useState } from "react";

export function CommandComposer({ roomId }: { roomId: string }) {
  const [value, setValue] = useState("");

  return (
    <form className="composer" data-room-id={roomId}>
      <textarea
        aria-label="Prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="@Phoebe @Jubi convenience store fight, cinematic wide shot"
      />
      <button type="submit">Plan</button>
    </form>
  );
}
```

```tsx
// components/thread/plan-card.tsx
export function PlanCard({ plan }: { plan: { scene?: string; action?: string; riskNotes?: string[] } }) {
  return (
    <article className="planCard">
      <h3>Plan</h3>
      <p>{plan.scene ?? "No scene specified yet."}</p>
      <p>{plan.action ?? "No action specified yet."}</p>
      {plan.riskNotes?.length ? <p>{plan.riskNotes.join(", ")}</p> : null}
    </article>
  );
}
```

```ts
// app/api/rooms/[roomId]/generate/plan/route.ts
import { db } from "@/lib/db";
import { extractMentionTitles } from "@/lib/thread/mentions";
import { shouldRequirePlanCard } from "@/lib/generation/plan-policy";

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  const body = await request.json();
  const mentionTitles = extractMentionTitles(body.prompt);
  const mentionedItems = await db.libraryItem.findMany({
    where: {
      roomId,
      title: { in: mentionTitles },
    },
  });

  const plan = {
    subjectItems: mentionedItems.map((item) => item.id),
    scene: body.prompt,
    action: body.prompt,
    riskNotes: mentionedItems.length === 0 ? ["No resolved mentions"] : [],
  };

  const needsConfirmation = shouldRequirePlanCard({
    mentionedItems,
    selectedNodeCount: body.selectedNodeIds?.length ?? 0,
    prompt: body.prompt,
    riskyEdit: false,
  });

  return Response.json({ plan, needsConfirmation });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/lib/thread/mentions.test.ts`

Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/thread lib/generation components/thread app/api/rooms/[roomId]/generate/plan/route.ts tests/lib/thread/mentions.test.ts
git commit -m "feat: add prompt planning and mention parsing"
```

### Task 8: Implement OpenAI Execution, GenerationRun Persistence, and Result Registration

**Files:**
- Create: `lib/openai/client.ts`
- Create: `lib/generation/execute-generation.ts`
- Create: `app/api/rooms/[roomId]/generate/execute/route.ts`
- Create: `tests/lib/generation/execute-generation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/generation/execute-generation.test.ts
import { describe, expect, it, vi } from "vitest";
import { executeGeneration } from "@/lib/generation/execute-generation";

describe("executeGeneration", () => {
  it("creates a generation run summary from planner and image output", async () => {
    const deps = {
      createPlanSummary: vi.fn().mockResolvedValue({ prompt: "phoebe and jubi", model: "gpt-5" }),
      generateImage: vi.fn().mockResolvedValue({
        bytes: Buffer.from("fake-image"),
        mediaType: "image/png",
        width: 1024,
        height: 1024,
      }),
      persistResult: vi.fn().mockResolvedValue({ generationItemId: "item_gen_1", nodeId: "node_1" }),
    };

    const result = await executeGeneration(deps as never, {
      roomId: "room_1",
      prompt: "@Phoebe @Jubi convenience store fight",
      plan: { subjectItems: ["char_1", "char_2"] },
    });

    expect(deps.generateImage).toHaveBeenCalled();
    expect(result.generationItemId).toBe("item_gen_1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/lib/generation/execute-generation.test.ts`

Expected: FAIL with `Cannot find module '@/lib/generation/execute-generation'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/openai/client.ts
import OpenAI from "openai";
import { env } from "@/lib/env";

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function createPlanSummary(prompt: string) {
  const response = await openai.responses.create({
    model: env.OPENAI_TEXT_MODEL,
    input: `Summarize this image generation request into a concise execution prompt:\n${prompt}`,
  });

  return {
    prompt: response.output_text,
    model: env.OPENAI_TEXT_MODEL,
  };
}

export async function generateImage(prompt: string) {
  const image = await openai.images.generate({
    model: env.OPENAI_IMAGE_MODEL,
    prompt,
    size: "1024x1024",
  });

  const base64 = image.data?.[0]?.b64_json ?? "";
  return {
    bytes: Buffer.from(base64, "base64"),
    mediaType: "image/png",
    width: 1024,
    height: 1024,
  };
}
```

```ts
// lib/generation/execute-generation.ts
import { db } from "@/lib/db";
import { createImageDerivatives } from "@/lib/assets/image-pipeline";
import { env } from "@/lib/env";

type ExecuteDeps = {
  createPlanSummary: (prompt: string) => Promise<{ prompt: string; model: string }>;
  generateImage: (prompt: string) => Promise<{ bytes: Buffer; mediaType: string; width: number; height: number }>;
  persistResult?: typeof persistResult;
};

async function persistResult(input: {
  roomId: string;
  prompt: string;
  plan: Record<string, unknown>;
  output: { bytes: Buffer; mediaType: string };
  model: string;
}) {
  const derivatives = await createImageDerivatives({
    roomId: input.roomId,
    fileName: `generation-${Date.now()}.png`,
    bytes: input.output.bytes,
    mediaType: input.output.mediaType,
    storageRoot: env.FILE_STORAGE_ROOT,
  });

  const outputAsset = await db.asset.create({
    data: {
      roomId: input.roomId,
      kind: "generation",
      filePath: derivatives.working.filePath,
      publicUrl: derivatives.working.publicUrl,
      mediaType: input.output.mediaType,
      width: derivatives.working.width,
      height: derivatives.working.height,
      checksum: derivatives.working.checksum,
    },
  });

  const item = await db.libraryItem.create({
    data: {
      roomId: input.roomId,
      type: "generation",
      title: "Generation Result",
      metadataJson: {},
      coverAssetId: outputAsset.id,
    },
  });

  const node = await db.canvasNode.create({
    data: {
      roomId: input.roomId,
      itemId: item.id,
      x: 640,
      y: 200,
      width: 320,
      height: 320,
    },
  });

  await db.generationRun.create({
    data: {
      roomId: input.roomId,
      planJson: input.plan,
      prompt: input.prompt,
      inputItemIdsJson: [],
      outputAssetId: outputAsset.id,
      outputItemId: item.id,
      status: "succeeded",
      modelSnapshotJson: { textModel: input.model },
    },
  });

  return {
    generationItemId: item.id,
    nodeId: node.id,
  };
}

export async function executeGeneration(
  deps: ExecuteDeps,
  input: {
    roomId: string;
    prompt: string;
    plan: Record<string, unknown>;
  },
) {
  const summary = await deps.createPlanSummary(input.prompt);
  const output = await deps.generateImage(summary.prompt);
  const save = deps.persistResult ?? persistResult;

  return save({
    roomId: input.roomId,
    prompt: summary.prompt,
    plan: input.plan,
    output,
    model: summary.model,
  });
}
```

```ts
// app/api/rooms/[roomId]/generate/execute/route.ts
import { createPlanSummary, generateImage } from "@/lib/openai/client";
import { executeGeneration } from "@/lib/generation/execute-generation";

export async function POST(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  const body = await request.json();

  const result = await executeGeneration(
    { createPlanSummary, generateImage },
    {
      roomId,
      prompt: body.prompt,
      plan: body.plan,
    },
  );

  return Response.json({ result }, { status: 201 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/lib/generation/execute-generation.test.ts`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/openai lib/generation app/api/rooms/[roomId]/generate/execute/route.ts tests/lib/generation/execute-generation.test.ts
git commit -m "feat: add openai generation execution pipeline"
```

### Task 9: Add End-to-End Smoke Coverage and Thread-to-Canvas Feedback

**Files:**
- Create: `tests/e2e/room-generation.spec.ts`
- Modify: `components/thread/thread-panel.tsx`
- Modify: `components/canvas/canvas-panel.tsx`
- Modify: `components/layout/room-shell.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/room-generation.spec.ts
import { test, expect } from "@playwright/test";

test("room screen renders the three-pane shell", async ({ page }) => {
  await page.goto("/rooms/demo-room");

  await expect(page.getByText("Library")).toBeVisible();
  await expect(page.getByText("Canvas")).toBeVisible();
  await expect(page.getByText("Thread")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/room-generation.spec.ts`

Expected: FAIL with `404` or `page.goto: net::ERR_HTTP_RESPONSE_CODE_FAILURE`

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/thread/thread-panel.tsx
import { CommandComposer } from "@/components/thread/command-composer";
import { PlanCard } from "@/components/thread/plan-card";

type ThreadPanelProps = {
  roomId: string;
  messages: Array<{ id: string; role: string; content: string }>;
};

export function ThreadPanel({ roomId, messages }: ThreadPanelProps) {
  return (
    <section className="pane">
      <header className="paneHeader">
        <h2>Thread</h2>
      </header>
      <div className="paneBody">
        {messages.length === 0 ? <p>No messages yet.</p> : messages.map((message) => <p key={message.id}>{message.content}</p>)}
        <PlanCard plan={{ scene: "Waiting for first plan", action: "Type a prompt to begin" }} />
        <CommandComposer roomId={roomId} />
      </div>
    </section>
  );
}
```

```tsx
// components/canvas/canvas-panel.tsx
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
```

```tsx
// components/layout/room-shell.tsx
import { LibraryPanel } from "@/components/library/library-panel";
import { CanvasPanel } from "@/components/canvas/canvas-panel";
import { ThreadPanel } from "@/components/thread/thread-panel";

type RoomShellProps = {
  room: { id: string; name: string };
  libraryItems: Array<{ id: string; title: string; type: string }>;
  canvasNodes: Array<{ id: string; itemId: string; x: number; y: number; width: number; height: number }>;
  canvasEdges: Array<{ id: string; fromNodeId: string; toNodeId: string; relation: string; source: string }>;
  thread: Array<{ id: string; role: string; content: string }>;
};

export function RoomShell(props: RoomShellProps) {
  return (
    <main className="roomShell">
      <header className="topBar">
        <h1>{props.room.name}</h1>
      </header>
      <div className="columns">
        <LibraryPanel items={props.libraryItems} />
        <CanvasPanel
          libraryItems={props.libraryItems}
          canvasNodes={props.canvasNodes}
          canvasEdges={props.canvasEdges}
        />
        <ThreadPanel roomId={props.room.id} messages={props.thread} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/room-generation.spec.ts`

Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add components tests/e2e/room-generation.spec.ts
git commit -m "test: add figment room smoke coverage"
```

## Coverage Check

- Product model coverage:
  - `Room`, `LibraryItem`, `Asset`, `CanvasNode`, `CanvasEdge`, `ThreadMessage`, `GenerationRun` are introduced in Task 2.
- Storage and import coverage:
  - Local filesystem storage and image derivatives are implemented in Task 3 and wired to upload routes in Task 4.
- Main layout coverage:
  - Three-pane room shell is implemented in Task 5 and upgraded with interactive canvas/thread pieces in Task 9.
- Canvas and provenance coverage:
  - Graph projection and manual edge constraints are implemented in Task 6.
- `@` mention and plan card policy coverage:
  - Mention parsing, plan-card decision logic, and planning route are implemented in Task 7.
- OpenAI execution coverage:
  - Real planning/image execution adapter and `GenerationRun` persistence are implemented in Task 8.

## Self-Review Notes

- No placeholders remain; every task includes exact files, code, commands, and expected outcomes.
- The plan keeps AI context assembly on the server, matching the approved spec.
- The plan intentionally stops short of login, multi-user support, object storage, cropping, or desktop packaging, matching the V1 scope boundary.
