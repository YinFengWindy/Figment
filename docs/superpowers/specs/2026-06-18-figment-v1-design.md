# Figment V1 设计文档

## 概要

Figment 是一个独立的桌面端图片创作 Agent，面向以角色为核心的视觉创作。V1 聚焦“画布式群像创作房间”：用户可以导入或创建视觉素材，通过 `@引用` 使用角色和素材，调用 GPT Image 2 生成图片，并在画布上直接看到生成结果与参考来源之间的关系。

V1 不是 TuanChat，不是多模型平台，也不是 ComfyUI / NovelAI 工作台。TuanChat 的角色模块和 NovelAiAgent 的 PRD 文档只作为产品形态与 Agent 工作流参考。

## 产品定位

Figment V1 是一个基于 GPT 的多角色图片创作 Agent。

核心体验是：

1. 用户创建一个画布房间。
2. 用户向房间素材库导入角色、图片、场景、风格参考或文本设定。
3. 导入的角色立绘或参考图可以显示在画布上。
4. 用户在右侧对话面板输入创作需求，并用 `@引用` 指定房间里的素材。
5. GPT-5.x 将用户指令、被引用素材、当前选中的画布节点和房间上下文整理成生成计划。
6. GPT Image 2 执行图片生成或图片编辑。
7. 输出结果作为新的画布节点出现，并自动连接到它参考过的输入节点。

核心原则：

```text
画布就是记忆。
关系线就是创作脉络。
对话是驱动画布的命令入口。
```

## 非目标

V1 不做：

- ComfyUI 执行。
- NovelAI 执行。
- LoRA、采样器、workflow、tag prompt 控制。
- TuanChat 数据同步。
- 房间之上的 Project 项目层。
- 独立于画布之外的生成历史列表。
- 完整的多房间世界观或项目管理系统。

后续可以增加更多后端适配器，但 V1 不暴露多后端复杂度。

## 核心产品模型

顶层对象是 `CanvasRoom`。

```text
CanvasRoom = Library + Canvas + Thread
```

### CanvasRoom

`CanvasRoom` 是一个独立创作房间。它拥有一次创作会话所需的全部数据。

建议字段：

```text
CanvasRoom
  roomId
  name
  settings
  createdAt
  updatedAt
```

房间设置包含默认生成偏好、OpenAI 模型配置引用、默认画布行为，以及可选的房间级视觉风格指导。

### LibraryItem

房间只有一个统一素材库。角色不再放在独立角色库里，而是素材库的一种类型。

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

V1 素材类型：

```text
character
image
style
scene
note
generation
```

#### character

`character` 表示可复用的角色视觉身份。

角色元数据应支持：

```text
name
visualBrief
lockedTraits
referenceAssetIds
mainReferenceAssetId
notes
```

角色可以从文本创建，也可以从导入图片创建，或者两者结合。参考图很有用，但不是创建角色的必要条件。

#### image

`image` 表示导入的参考图、草图、截图、背景图、立绘和其他图片资产。

图片元数据应支持：

```text
filePath
usage: reference | sprite | avatar | background | sketch | other
notes
```

#### style

`style` 表示视觉方向，例如赛璐璐、厚涂、电影感光影、概念设定稿氛围等。

#### scene

`scene` 表示可复用的地点或环境概念。

#### note

`note` 表示自由文本设定，例如角色关系、世界观、禁改项或提醒。

#### generation

`generation` 表示生成结果。生成历史存在于画布上的 generation 节点中，而不是单独列表。

生成结果元数据应支持：

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

实际文件作为 `Asset` 存储，并被素材库条目引用。

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

V1 使用本地文件存储媒体文件。SQLite 存元数据，文件系统存原始图片和生成图片。

### CanvasNode

画布上每个可见对象都是一个节点，节点引用一个素材库条目。

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

导入的角色和图片可以放到画布上。生成结果必须作为 `generation` 节点出现在画布上。

### CanvasEdge

关系线描述节点之间的创作关系。

```text
CanvasEdge
  edgeId
  roomId
  fromNodeId
  toNodeId
  relation
  createdAt
```

V1 关系类型：

```text
baseline
reference
edit_from
variant_of
rejected
```

系统会在生成完成后自动创建关系线。用户后续可以调整或删除这些关系线。

### Thread

右侧对话是房间的命令线程。

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

对话不是主要历史视图。它记录用户指令、Agent 决策和说明。画布才是主要创作记忆。

## 交互模型

### 主布局

V1 使用三栏结构：

```text
左侧：统一素材库
中间：画布
右侧：对话与生成控制
```

左侧素材库用于导入或创建角色、图片、风格、场景和设定。中间画布展示源素材、生成图片和关系线。右侧面板用于输入自然语言指令。

### @引用流程

用户通过 `@引用` 使用房间素材。

示例：

```text
@菲比 @啾比 让她们在夜晚便利店门口吵架，横版电影感
```

系统按以下优先级解析上下文：

```text
明确 @引用 > 当前选中的画布节点 > 房间上下文
```

规则：

- 明确 `@引用` 具有绑定效力。Agent 不能偷偷替换被引用角色。
- 当前选中的画布节点会作为额外参考。
- 房间上下文只作为兜底，例如最近生成结果、附近节点和默认风格偏好。
- 如果被引用素材存在歧义，Agent 必须先澄清再生成。

### 生成计划

GPT-5.x 在调用 GPT Image 2 前生成结构化 `GenerationPlan`。

建议结构：

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

简单、低风险请求可以用紧凑计划直接执行。复杂、有歧义、成本较高或会改变基线的操作，应先在 UI 中展示生成计划卡。

### 生成结果落位

生成成功后，系统执行：

1. 将输出文件保存为 `Asset`。
2. 创建 `LibraryItem(type = generation)`。
3. 为生成结果创建 `CanvasNode`。
4. 将节点放在参考输入附近，或当前视野焦点附近。
5. 从参考节点自动连线到生成节点。
6. 在右侧对话中补充一条 assistant 消息，说明使用了哪些素材、生成了什么。

因此，生成历史以画布关系脉络的方式存在。

## Agent 工作流

Figment 借鉴 AkashicAgent 的生命周期骨架，以及 NovelAiAgent 的业务工作流形态。

### 生命周期

```text
BeforeTurn
  读取房间、素材库、当前选中的画布节点、近期对话消息和相关画布关系。

BeforeReasoning
  准备模型上下文、可用工具、生成约束和被引用资产。

Reasoner
  理解用户意图，解析 @引用，构建生成计划，在条件满足时调用 GPT Image 2，并可选进行结果评估。

AfterReasoning
  规范化计划、工具结果、输出资产、关系线和 assistant 摘要。

AfterTurn
  持久化资产、素材库条目、画布节点、关系线、对话消息和反馈入口。
```

### 业务流程

V1 默认业务流程：

```text
意图识别
  理解用户请求的图片操作和被引用素材。

生成规划
  构建模型中立但可落到 GPT Image 2 的生成计划。

生成执行
  使用文本和图片参考调用 GPT Image 2。

结果登记
  将输出保存为 generation 素材和画布节点。

结果总结
  说明来源关系，并给出下一步建议。
```

V1 不要求自动重试。系统可以提出修正建议，由用户决定是否继续生成下一版。

## 存储

V1 使用 `SQLite + 本地素材文件夹`。

SQLite 存储：

- 房间。
- 素材库条目元数据。
- 资产元数据。
- 画布节点。
- 画布关系线。
- 对话消息。
- 生成计划和生成结果。

文件系统存储：

- 导入的源文件。
- 必要时裁剪或标准化后的参考图。
- 生成输出图。
- 缩略图和预览图。

Markdown 导出是可选能力，不属于 V1 核心存储模型。

## OpenAI 模型分工

V1 只使用 OpenAI 模型：

- GPT-5.x：自然语言理解、角色分析、生成规划、计划摘要和结果总结。
- GPT Image 2：图片生成和图片编辑。

实现 API 调用前，必须基于 OpenAI 官方文档确认当前图像 API 字段与参数。

## 设计参考

TuanChat 角色模块作为概念参考：

- `UserRole` 启发角色身份和描述。
- `RoleAvatar` 启发源图、立绘、头像和参考资产的分层。
- `RoleAbility.act` 启发结构化视觉档案字段。

NovelAiAgent PRD 作为工作流参考：

- 意图识别。
- 生成规划。
- 生成执行。
- 结果评估或总结。
- 重试作为未来可选能力。

AkashicAgent 作为架构参考：

- Turn 生命周期。
- 工具注册。
- 上下文准备。
- 记忆和对话分层。
- 插件化扩展点。

## V1 成功标准

V1 达成目标时，用户应该可以：

1. 创建一个画布房间。
2. 向统一素材库添加至少两个角色素材。
3. 将角色参考节点放到画布上。
4. 在右侧对话中 `@引用` 角色并请求生成图片。
5. 通过 GPT Image 2 生成图片。
6. 在画布上看到生成结果节点。
7. 看到系统自动从参考素材连线到生成结果。
8. 选中或引用生成结果，继续进行下一步创作。

## 待确认问题

- 生成计划卡是始终展示，还是只在复杂请求时展示。
- V1 是否支持手动创建关系线，还是只支持自动关系线。
- 纯文本创建角色时，是否需要强制确认视觉档案。
- 导入图片后，V1 是否需要支持裁剪或角色抽取流程，还是放到后续版本。
