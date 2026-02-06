# Moltbot 插件开发文档

> 来源：moltbot/docs/plugin.md

---

## 快速开始

插件是一个**小型代码模块**，用于扩展 Moltbot 的功能（命令、工具和 Gateway RPC）。

### 基本操作

```bash
# 查看已加载的插件
moltbot plugins list

# 安装插件
moltbot plugins install @moltbot/voice-call

# 启用/禁用插件
moltbot plugins enable <id>
moltbot plugins disable <id>
```

---

## 插件可以注册的功能

- Gateway RPC 方法
- Gateway HTTP 处理器
- Agent 工具
- CLI 命令
- 后台服务
- 配置验证
- Skills（技能）
- 自动回复命令

---

## 插件发现顺序

Moltbot 按以下顺序扫描插件：

1. 配置路径：`plugins.load.paths`
2. 工作区扩展：`<workspace>/.clawdbot/extensions/`
3. 全局扩展：`~/.clawdbot/extensions/`
4. 内置扩展：`<moltbot>/extensions/`（默认禁用）

---

## 插件清单文件

每个插件必须包含 `moltbot.plugin.json` 文件：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

---

## package.json 配置

```json
{
  "name": "@moltbot/my-plugin",
  "moltbot": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (API)",
      "docsPath": "/channels/my-channel",
      "blurb": "My channel description.",
      "aliases": ["mc"]
    },
    "install": {
      "npmSpec": "@moltbot/my-plugin",
      "localPath": "extensions/my-plugin",
      "defaultChoice": "npm"
    }
  }
}
```

---

## 插件配置

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } }
    }
  }
}
```

---

## 插件 API

插件可以导出：

- 函数：`(api) => { ... }`
- 对象：`{ id, name, configSchema, register(api) { ... } }`

### 注册消息渠道

```ts
const myChannel = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "demo channel plugin.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      (cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? { accountId }),
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async () => ({ ok: true }),
  },
};

export default function (api) {
  api.registerChannel({ plugin: myChannel });
}
```

### 注册 Gateway RPC 方法

```ts
export default function (api) {
  api.registerGatewayMethod("myplugin.status", ({ respond }) => {
    respond(true, { ok: true });
  });
}
```

### 注册 CLI 命令

```ts
export default function (api) {
  api.registerCli(({ program }) => {
    program.command("mycmd").action(() => {
      console.log("Hello");
    });
  }, { commands: ["mycmd"] });
}
```

### 注册自动回复命令

```ts
export default function (api) {
  api.registerCommand({
    name: "mystatus",
    description: "Show plugin status",
    handler: (ctx) => ({
      text: `Plugin is running! Channel: ${ctx.channel}`,
    }),
  });
}
```

### 注册后台服务

```ts
export default function (api) {
  api.registerService({
    id: "my-service",
    start: () => api.logger.info("ready"),
    stop: () => api.logger.info("bye"),
  });
}
```

---

## 开发新消息渠道的步骤

1. **选择 ID 和配置结构**
   - 所有渠道配置在 `channels.<id>` 下
   - 多账户使用 `channels.<id>.accounts.<accountId>`

2. **定义渠道元数据**
   - `meta.label`, `meta.selectionLabel`, `meta.docsPath`, `meta.blurb`

3. **实现必需的适配器**
   - `config.listAccountIds` + `config.resolveAccount`
   - `capabilities`（聊天类型、媒体、线程等）
   - `outbound.deliveryMode` + `outbound.sendText`

4. **添加可选适配器**
   - `setup`（向导）、`security`（DM 策略）、`status`（健康/诊断）
   - `gateway`（启动/停止/登录）、`mentions`、`threading`、`streaming`
   - `actions`（消息操作）、`commands`（原生命令行为）

5. **注册渠道**
   - `api.registerChannel({ plugin })`

---

## 最小渠道插件示例

```ts
const plugin = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "AcmeChat messaging channel.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      (cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? { accountId }),
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text }) => {
      // 在这里发送消息到你的渠道
      return { ok: true };
    },
  },
};

export default function (api) {
  api.registerChannel({ plugin });
}
```

---

## 发布到 npm

推荐的包命名：
- 主包：`moltbot`
- 插件：`@moltbot/*`（例如：`@moltbot/voice-call`）

发布要求：
- `package.json` 必须包含 `moltbot.extensions`
- 入口文件可以是 `.js` 或 `.ts`
- 使用 `moltbot plugins install <npm-spec>` 安装

---

## 安全注意事项

插件与 Gateway 在同一进程中运行，视为受信任代码：

- 只安装你信任的插件
- 优先使用 `plugins.allow` 白名单
- 更改后重启 Gateway
