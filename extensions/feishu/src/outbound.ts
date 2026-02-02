/**
 * 飞书出站适配器
 */

import { sendImageFeishu, sendMarkdownCardFeishu, sendMessageFeishu } from "./send.js";
import { getFeishuRuntime } from "./runtime.js";
import type { FeishuConfig } from "./types.js";
import { FeishuConfigSchema } from "./config.js";

export interface OutboundConfig {
  channels?: {
    feishu?: FeishuConfig;
  };
}

export interface SendResult {
  channel: string;
  messageId: string;
  chatId?: string;
  conversationId?: string;
}

function parseTarget(to: string): { targetId: string; receiveIdType: "chat_id" | "open_id" } {
  if (to.startsWith("chat:")) {
    return { targetId: to.slice(5), receiveIdType: "chat_id" };
  }
  if (to.startsWith("user:")) {
    return { targetId: to.slice(5), receiveIdType: "open_id" };
  }
  return { targetId: to, receiveIdType: "chat_id" };
}

export const feishuOutbound = {
  deliveryMode: "direct" as const,
  textChunkLimit: 4000,
  chunkerMode: "markdown" as const,

  chunker: (text: string, limit: number): string[] => {
    try {
      const runtime = getFeishuRuntime();
      if (runtime.channel?.text?.chunkMarkdownText) {
        return runtime.channel.text.chunkMarkdownText(text, limit);
      }
    } catch {
      // runtime 未初始化，返回原文
    }
    return [text];
  },

  sendText: async (params: { cfg: OutboundConfig; to: string; text: string }): Promise<SendResult> => {
    const { cfg, to, text } = params;

    const rawFeishuCfg = cfg.channels?.feishu;
    const parsedCfg = rawFeishuCfg ? FeishuConfigSchema.safeParse(rawFeishuCfg) : null;
    const feishuCfg = parsedCfg?.success ? parsedCfg.data : rawFeishuCfg;
    if (!feishuCfg) {
      throw new Error("Feishu channel not configured");
    }

    const { targetId, receiveIdType } = parseTarget(to);

    // Minimal runtime trace for markdown vs text path
    const sendMode = feishuCfg.sendMarkdownAsCard ? "interactive markdown card" : "text message";
    // eslint-disable-next-line no-console
    console.log(
      `[feishu] outbound sendText via ${sendMode} (receive_id_type=${receiveIdType}, text_len=${text.length})`
    );

    const result = feishuCfg.sendMarkdownAsCard
      ? await sendMarkdownCardFeishu({
          cfg: feishuCfg,
          to: targetId,
          text,
          receiveIdType,
        })
      : await sendMessageFeishu({
          cfg: feishuCfg,
          to: targetId,
          text,
          receiveIdType,
        });

    return {
      channel: "feishu",
      messageId: result.messageId,
      chatId: result.chatId,
      conversationId: result.chatId,
    };
  },

  sendMedia: async (params: {
    cfg: OutboundConfig;
    to: string;
    text?: string;
    mediaUrl?: string;
  }): Promise<SendResult> => {
    const { cfg, to, text, mediaUrl } = params;

    const feishuCfg = cfg.channels?.feishu;
    if (!feishuCfg) {
      throw new Error("Feishu channel not configured");
    }

    const { targetId, receiveIdType } = parseTarget(to);

    if (text?.trim()) {
      await sendMessageFeishu({
        cfg: feishuCfg,
        to: targetId,
        text,
        receiveIdType,
      });
    }

    if (mediaUrl) {
      try {
        const result = await sendImageFeishu({
          cfg: feishuCfg,
          to: targetId,
          mediaUrl,
          receiveIdType,
        });
        return {
          channel: "feishu",
          messageId: result.messageId,
          chatId: result.chatId,
          conversationId: result.chatId,
        };
      } catch (err) {
        console.error(`[feishu] sendImageFeishu failed:`, err);
        const fallbackText = `📎 ${mediaUrl}`;
        const result = await sendMessageFeishu({
          cfg: feishuCfg,
          to: targetId,
          text: fallbackText,
          receiveIdType,
        });
        return {
          channel: "feishu",
          messageId: result.messageId,
          chatId: result.chatId,
          conversationId: result.chatId,
        };
      }
    }

    return {
      channel: "feishu",
      messageId: text?.trim() ? `text_${Date.now()}` : "empty",
      chatId: targetId,
      conversationId: targetId,
    };
  },
};
