# Moltbot 插件清单文档

> 来源：moltbot/docs/plugins/manifest.md

---

## 概述

每个插件**必须**在插件根目录下提供 `moltbot.plugin.json` 文件。Moltbot 使用此清单来验证配置，**无需执行插件代码**。

---

## 必需字段

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

### 必需键

| 键 | 类型 | 说明 |
|---|------|------|
| `id` | string | 插件的规范 ID |
| `configSchema` | object | 插件配置的 JSON Schema |

### 可选键

| 键 | 类型 | 说明 |
|---|------|------|
| `kind` | string | 插件类型（如 `"memory"`） |
| `channels` | array | 此插件注册的渠道 ID |
| `providers` | array | 此插件注册的提供者 ID |
| `skills` | array | 要加载的技能目录（相对于插件根目录） |
| `name` | string | 插件显示名称 |
| `description` | string | 插件简短描述 |
| `uiHints` | object | UI 渲染的配置字段标签/占位符/敏感标志 |
| `version` | string | 插件版本（信息性） |

---

## JSON Schema 要求

- **每个插件必须提供 JSON Schema**，即使不接受任何配置
- 空 Schema 是可接受的：`{ "type": "object", "additionalProperties": false }`
- Schema 在配置读/写时验证，而不是在运行时

---

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非渠道 ID 由插件清单声明
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的**插件 ID，未知 ID 是**错误**
- 如果插件已安装但清单或 Schema 损坏或缺失，验证失败，Doctor 会报告插件错误
- 如果插件配置存在但插件被**禁用**，配置会保留并在 Doctor + 日志中显示**警告**

---

## 完整示例

```json
{
  "id": "dingtalk",
  "name": "DingTalk",
  "description": "钉钉消息渠道插件",
  "version": "0.1.0",
  "channels": ["dingtalk"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "enabled": { "type": "boolean" },
      "clientId": { "type": "string" },
      "clientSecret": { "type": "string" }
    }
  },
  "uiHints": {
    "clientId": { "label": "Client ID" },
    "clientSecret": { "label": "Client Secret", "sensitive": true }
  }
}
```
