# Figment V1 Design

## Summary

Figment is an independent desktop image-creation agent for character-driven visual work. V1 focuses on a canvas-based ensemble room where users import or create visual materials, reference characters with `@mentions`, generate images with GPT Image 2, and see generation lineage directly on the canvas.

V1 is not TuanChat, a multi-model platform, or a ComfyUI/NovelAI workbench. TuanChat's role module and NovelAiAgent's workflow documents are references for product shape and agent flow only.

## Product Positioning

Figment V1 is a GPT image creation agent for multi-character visual brainstorming.

The core experience is:

1. The user creates a canvas room.
2. The user imports characters, images, scenes, style references, or notes into the room library.
3. Imported character standees or reference images can appear on the canvas.
4. The user writes instructions in the right-side conversation panel and references room materials with `@mentions`.
5. GPT-5.x turns the instruction, mentioned items, selected canvas nodes, and room context into a generation plan.
6. GPT Image 2 generates or edits the image.
7. The output appears as a new canvas node and is automatically connected to its referenced inputs.

The guiding principle is:

```text
The canvas is memory.
Edges are creative lineage.
The conversation is the command surface.
```

## Non-Goals

V1 does not include:

- ComfyUI execution.
- NovelAI execution.
- LoRA, sampler, workflow, or tag-prompt controls.
- TuanChat data synchronization.
- A separate project layer above rooms.
- A separate generation-history list outside the canvas.
- Full multi-room worldbuilding or project management.

Future adapters can be added later, but V1 should not expose multi-backend complexity.

## Core Product Model

The top-level object is `CanvasRoom`.

```text
CanvasRoom = Library + Canvas + Thread
```

### CanvasRoom

A `CanvasRoom` is one independent creative room. It owns all data needed for a creation session.

Suggested fields:

```text
CanvasRoom
  roomId
  name
  settings
  createdAt
  updatedAt
```

Room settings include default generation preferences, OpenAI model configuration references, default canvas behavior, and optional room-level visual style guidance.

### LibraryItem

The room has one unified library. Characters are not stored in a separate role library; they are one type of library item.

```text
LibraryItem
  itemId
  roomId
  type
  title
  description
  coverAssetId
  metadata
  createdAt
  updatedAt
```

V1 item types:

```text
character
image
style
scene
note
generation
```

#### character

Character items represent reusable visual identities.

Character metadata should support:

```text
name
visualBrief
lockedTraits
referenceAssetIds
mainReferenceAssetId
notes
```

Characters can be created from text, imported images, or both. A reference image is useful but not required.

#### image

Image items represent imported reference images, sketches, screenshots, backgrounds, standees, and other image assets.

Image metadata should support:

```text
filePath
usage: reference | sprite | avatar | background | sketch | other
notes
```

#### style

Style items represent visual direction, such as cel animation, thick paint, cinematic lighting, or concept-art mood.

#### scene

Scene items represent reusable locations or environment concepts.

#### note

Note items represent freeform text, relationship notes, worldbuilding details, constraints, or reminders.

#### generation

Generation items are generated outputs. Generation history lives on the canvas as generation nodes, not as a separate list.

Generation metadata should support:

```text
plan
prompt
inputItemIds
outputAssetId
feedback
status
modelSnapshot
```

### Asset

Physical files are stored as assets and referenced by library items.

```text
Asset
  assetId
  roomId
  filePath
  mediaType
  width
  height
  checksum
  createdAt
```

V1 stores files locally. SQLite stores metadata; the filesystem stores original and generated media.

### CanvasNode

Every visible object on the canvas is a node that references a library item.

```text
CanvasNode
  nodeId
  roomId
  itemId
  x
  y
  width
  height
  zIndex
  collapsed
  createdAt
  updatedAt
```

Imported characters and images can be placed on the canvas. Generated results are always placed on the canvas as `generation` nodes.

### CanvasEdge

Edges describe creative relationships between nodes.

```text
CanvasEdge
  edgeId
  roomId
  fromNodeId
  toNodeId
  relation
  createdAt
```

V1 relation types:

```text
baseline
reference
edit_from
variant_of
rejected
```

The system creates edges automatically after generation. Users can later adjust or delete them.

### Thread

The right-side conversation is the room command thread.

```text
ThreadMessage
  messageId
  roomId
  role: user | assistant | system
  content
  mentionedItemIds
  selectedNodeIdsSnapshot
  linkedGenerationItemId
  createdAt
```

The thread is not the primary history view. It records instructions, decisions, and agent explanations. The canvas remains the primary creative memory.

## Interaction Model

### Main Layout

V1 uses three major regions:

```text
Left: Unified library
Center: Canvas
Right: Conversation and generation control
```

The left library lets users import or create characters, images, styles, scenes, and notes. The center canvas shows source materials, generated images, and lineage edges. The right panel is where users issue natural-language commands.

### @Mention Flow

Users reference room materials with `@mentions`.

Example:

```text
@菲比 @啾比 让她们在夜晚便利店门口吵架，横版电影感
```

The system resolves context in priority order:

```text
Explicit @mentions > selected canvas nodes > room context
```

Rules:

- Explicit `@mentions` are binding. The agent must not silently swap referenced characters.
- Selected canvas nodes add extra references.
- Room context is only fallback context, such as recent results, nearby nodes, and default style preferences.
- If the referenced item is ambiguous, the agent asks for clarification before generation.

### Generation Planning

GPT-5.x creates a structured `GenerationPlan` before calling GPT Image 2.

Suggested shape:

```text
GenerationPlan
  subjectItems
  referenceItems
  scene
  actionOrRelationshipMoment
  camera
  style
  constraints
  outputCount
  riskNotes
```

For simple low-risk requests, the plan can remain compact and run directly. For complex, ambiguous, expensive, or baseline-changing actions, the UI should show a plan card before execution.

### Generation Result Placement

After generation succeeds:

1. Save the output file as an `Asset`.
2. Create `LibraryItem(type = generation)`.
3. Create a `CanvasNode` for the generation item.
4. Place it near referenced inputs or near the current viewport focus.
5. Create edges from referenced nodes to the generated node.
6. Add an assistant message summarizing what was used and what was produced.

Generation history is therefore visible as canvas lineage.

## Agent Workflow

Figment borrows the high-level lifecycle from AkashicAgent and the business workflow shape from NovelAiAgent.

### Lifecycle

```text
BeforeTurn
  Load room, library items, selected canvas nodes, recent thread messages, and relevant canvas lineage.

BeforeReasoning
  Prepare model context, available tools, generation constraints, and referenced assets.

Reasoner
  Interpret user intent, resolve @mentions, build generation plan, call GPT Image 2 when ready, and optionally evaluate results.

AfterReasoning
  Normalize plan, tool results, output assets, edges, and assistant summary.

AfterTurn
  Persist assets, library items, canvas nodes, edges, thread messages, and feedback hooks.
```

### Business Flow

V1's default business flow:

```text
Intent Recognition
  Understand requested image operation and referenced materials.

Generation Planning
  Build a model-neutral but GPT Image 2-ready plan.

Generation Execution
  Call GPT Image 2 with text and image references.

Result Registration
  Store the output as a generation item and canvas node.

Result Summary
  Explain source relationships and suggested next actions.
```

Automatic retry is not required for V1. The system can suggest fixes and let the user ask for another pass.

## Storage

Use `SQLite + local asset folders` for V1.

SQLite stores:

- Rooms.
- Library item metadata.
- Assets metadata.
- Canvas nodes.
- Canvas edges.
- Thread messages.
- Generation plans and results.

The filesystem stores:

- Imported source files.
- Cropped or normalized references if needed.
- Generated output images.
- Thumbnails and previews.

Markdown export is optional and not part of the core V1 storage model.

## OpenAI Model Roles

V1 uses OpenAI models only:

- GPT-5.x: natural-language understanding, character analysis, generation planning, plan summaries, and result summaries.
- GPT Image 2: image generation and image editing.

Implementation must verify the current OpenAI image API fields against official OpenAI docs before coding API calls.

## Design References

TuanChat role module is used as a conceptual reference:

- `UserRole` inspires character identity and description.
- `RoleAvatar` inspires source image, sprite, avatar, and reference asset separation.
- `RoleAbility.act` inspires structured visual profile fields.

NovelAiAgent PRDs are used as workflow references:

- Intent recognition.
- Generation planning.
- Generation execution.
- Result evaluation or summary.
- Retry as future optional behavior.

AkashicAgent is used as an architecture reference:

- Turn lifecycle.
- Tool registry.
- Context preparation.
- Memory and thread separation.
- Plugin-ready extension points.

## V1 Success Criteria

V1 is successful when a user can:

1. Create a canvas room.
2. Add at least two character items to the unified library.
3. Place character reference nodes on the canvas.
4. Use the right-side conversation to `@mention` characters and request an image.
5. Generate an image through GPT Image 2.
6. See the result appear on the canvas as a generation node.
7. See automatic edges from referenced materials to the generated result.
8. Continue from a generated node by selecting it or referencing it in conversation.

## Open Questions

- Whether generation plan cards are always shown or only shown for complex requests.
- Whether V1 supports manual edge creation or only automatic edges.
- Whether character creation from text should use a required visual-profile confirmation step.
- Whether imported images should have optional crop/role-extraction flows in V1 or later.
