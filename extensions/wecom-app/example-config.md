# 企业微信自建应用配置示例

## 配置说明

新增了 `apiHost` 参数，用于指定企业微信 API 的主机地址，默认为 `https://qyapi.weixin.qq.com`。

## 配置方式

### 1. 在 openclaw.json 中配置

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

### 2. 多账户配置

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
          "apiHost": "https://qyapi.weixin.qq.com",
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

### 3. 环境变量配置

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

## 自定义 API 主机

如果需要使用自定义的企业微信 API 主机（例如企业微信私有部署或代理服务器），可以这样配置：

```json
{
  "channels": {
    "wecom-app": {
      "enabled": true,
      "apiHost": "https://my-custom-qyapi.company.com",
      "corpId": "your-corp-id",
      "corpSecret": "your-corp-secret",
      "agentId": 1000002,
      "token": "your-token",
      "encodingAESKey": "your-encoding-aes-key"
    }
  }
}
```

这样就可以灵活地指向不同的企业微信 API 端点。