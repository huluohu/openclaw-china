# 企业微信自建应用 OpenClaw 插件

企业微信自建应用消息渠道插件，支持主动推送消息。

## 功能特性

- 支持接收和发送文本、图片、语音消息
- 支持主动发送消息给用户或群聊
- 支持 Markdown 格式消息
- 可配置的 API 主机地址（新增功能）
- 支持多账户配置

## 新增功能：可配置 API 地址

从 v0.1.0 版本开始，插件支持自定义企业微信 API 主机地址，这使得插件可以适应不同的部署环境。

### 配置方式

#### 1. 在 OpenClaw 配置文件 (openclaw.json) 中配置

```json
{
  "channels": {
    "wecom-app": {
      "enabled": true,
      "apiHost": "https://qyapi.weixin.qq.com",
      "corpId": "your-corp-id",
      "corpSecret": "your-corp-secret",
      "agentId": 1000002,
      "token": "your-token",
      "encodingAESKey": "your-encoding-aes-key"
    }
  }
}
```

#### 2. 多账户配置示例

```json
{
  "channels": {
    "wecom-app": {
      "defaultAccount": "main",
      "accounts": {
        "main": {
          "name": "主企业微信应用",
          "apiHost": "https://qyapi.weixin.qq.com",
          "corpId": "your-main-corp-id",
          "corpSecret": "your-main-corp-secret",
          "agentId": 1000002,
          "token": "your-main-token",
          "encodingAESKey": "your-main-encoding-aes-key"
        },
        "backup": {
          "name": "备用企业微信应用",
          "apiHost": "https://my-custom-qyapi.company.com",  // 自定义 API 地址
          "corpId": "your-backup-corp-id",
          "corpSecret": "your-backup-corp-secret",
          "agentId": 1000003,
          "token": "your-backup-token",
          "encodingAESKey": "your-backup-encoding-aes-key"
        }
      }
    }
  }
}
```

#### 3. 环境变量配置

也可以通过环境变量配置：

```bash
# 默认账户
export WECOM_APP_API_HOST="https://qyapi.weixin.qq.com"
export WECOM_APP_CORP_ID="your-corp-id"
export WECOM_APP_CORP_SECRET="your-corp-secret"
export WECOM_APP_AGENT_ID="1000002"
export WECOM_APP_TOKEN="your-token"
export WECOM_APP_ENCODING_AES_KEY="your-encoding-aes-key"
```

### API 主机地址配置说明

- `apiHost`: 企业微信 API 的主机地址
  - 默认值: `https://qyapi.weixin.qq.com`
  - 支持自定义地址，适用于私有部署或代理服务器场景
  - 必须包含协议部分（http:// 或 https://）

## 配置项说明

| 配置项 | 类型 | 说明 |
|--------|------|------|
| enabled | boolean | 是否启用插件 |
| apiHost | string | API 主机地址（新增） |
| corpId | string | 企业 ID |
| corpSecret | string | 应用 Secret |
| agentId | number | 应用 AgentId |
| token | string | 回调 Token |
| encodingAESKey | string | 回调消息加密密钥 |
| webhookPath | string | Webhook 路径 |
| receiveId | string | 接收者 ID |

## 安装和使用

1. 将插件复制到 OpenClaw 扩展目录
2. 在 openclaw.json 中添加插件配置
3. 重启 OpenClaw 服务

## 使用场景

- 企业内部沟通助手
- 工作流程自动化
- 通知和提醒服务
- AI 对话机器人

## 故障排除

如果遇到问题，请检查：

1. 企业微信应用是否已正确创建
2. CorpId、CorpSecret、AgentId 是否正确配置
3. Token 和 EncodingAESKey 是否匹配
4. Webhook 回调地址是否正确配置
5. API 主机地址是否可达（如果是自定义地址）

## 许可证

MIT