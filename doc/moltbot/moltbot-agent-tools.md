# Moltbot Agent 工具开发文档

> 来源：moltbot/docs/plugins/agent-tools.md

---

## 概述

Moltbot 插件可以注册 **Agent 工具**（JSON Schema 函数），这些工具在 Agent 运行期间暴露给 LLM。工具可以是：

- **必需的**（始终可用）
- **可选的**（需要用户选择启用）

---

## 基本工具

```ts
import { Type } from "@sinclair/typebox";

export default function (api) {
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({
      input: Type.String(),
    }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });
}
```

---

## 可选工具（需要用户启用）

可选工具**不会**自动启用，用户必须将其添加到 Agent 白名单中。

```ts
export default function (api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a local workflow",
      parameters: {
        type: "object",
        properties: {
          pipeline: { type: "string" },
        },
        required: ["pipeline"],
      },
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

### 启用可选工具

在 `agents.list[].tools.allow` 或全局 `tools.allow` 中配置：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: [
            "workflow_tool",  // 具体工具名
            "workflow",       // 插件 ID（启用该插件的所有工具）
            "group:plugins"   // 所有插件工具
          ]
        }
      }
    ]
  }
}
```

---

## 规则和提示

- 工具名称**不能**与核心工具名称冲突，冲突的工具会被跳过
- 白名单中使用的插件 ID 不能与核心工具名称冲突
- 对于会触发副作用或需要额外二进制文件/凭证的工具，优先使用 `optional: true`
