/**
 * 飞书发送消息
 */

import type { FeishuConfig } from "./config.js";
import type { FeishuSendResult } from "./types.js";
import { createFeishuClientFromConfig } from "./client.js";
import * as fsPromises from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

export interface SendMessageParams {
  cfg: FeishuConfig;
  to: string;
  text: string;
  receiveIdType?: "chat_id" | "open_id";
}

export interface SendMediaParams {
  cfg: FeishuConfig;
  to: string;
  mediaUrl: string;
  receiveIdType?: "chat_id" | "open_id";
}

export async function sendMessageFeishu(params: SendMessageParams): Promise<FeishuSendResult> {
  const { cfg, to, text, receiveIdType = "chat_id" } = params;

  const client = createFeishuClientFromConfig(cfg);

  try {
    const result = await client.im.v1.message.create({
      params: {
        receive_id_type: receiveIdType,
      },
      data: {
        receive_id: to,
        msg_type: "text",
        content: JSON.stringify({ text }),
      },
    });

    const messageId = (result as { data?: { message_id?: string } })?.data?.message_id ?? "";

    return {
      messageId,
      chatId: to,
    };
  } catch (err) {
    throw new Error(`Feishu send message failed: ${String(err)}`);
  }
}

export interface SendCardParams {
  cfg: FeishuConfig;
  to: string;
  card: Record<string, unknown>;
  receiveIdType?: "chat_id" | "open_id";
}

export async function sendCardFeishu(params: SendCardParams): Promise<FeishuSendResult> {
  const { cfg, to, card, receiveIdType = "chat_id" } = params;
  const client = createFeishuClientFromConfig(cfg);

  try {
    const result = await client.im.v1.message.create({
      params: {
        receive_id_type: receiveIdType,
      },
      data: {
        receive_id: to,
        msg_type: "interactive",
        content: JSON.stringify(card),
      },
    });

    const messageId = (result as { data?: { message_id?: string } })?.data?.message_id ?? "";

    return {
      messageId,
      chatId: to,
    };
  } catch (err) {
    throw new Error(`Feishu send card failed: ${String(err)}`);
  }
}

export async function sendImageFeishu(params: SendMediaParams): Promise<FeishuSendResult> {
  const { cfg, to, mediaUrl, receiveIdType = "chat_id" } = params;
  const client = createFeishuClientFromConfig(cfg);

  try {
    const src = stripTitleFromUrl(mediaUrl);
    const { buffer, fileName } = isHttpUrl(src)
      ? await fetchImageBuffer(src)
      : await readLocalImageBuffer(resolveLocalPath(src));
    const imageKey = await uploadFeishuImage({ cfg, buffer, fileName });

    const result = await client.im.v1.message.create({
      params: {
        receive_id_type: receiveIdType,
      },
      data: {
        receive_id: to,
        msg_type: "image",
        content: JSON.stringify({ image_key: imageKey }),
      },
    });

    const messageId = (result as { data?: { message_id?: string } })?.data?.message_id ?? "";

    return {
      messageId,
      chatId: to,
    };
  } catch (err) {
    throw new Error(`Feishu send image failed: ${String(err)}`);
  }
}

export function buildMarkdownCard(text: string): Record<string, unknown> {
  return {
    config: {
      wide_screen_mode: true,
    },
    elements: [
      {
        tag: "markdown",
        content: text,
      },
    ],
  };
}

export async function sendMarkdownCardFeishu(params: SendMessageParams): Promise<FeishuSendResult> {
  const { cfg, to, text, receiveIdType = "chat_id" } = params;
  const card = await buildMarkdownCardWithImages({ cfg, text });
  return sendCardFeishu({ cfg, to, card, receiveIdType });
}

// Standalone markdown image, and image wrapped in a link: [![alt](img)](link)
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;
const MARKDOWN_LINKED_IMAGE_RE = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g;
const HTML_IMAGE_RE =
  /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi;
const IMAGE_UPLOAD_TIMEOUT_MS = 30000;

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isFileUrl(value: string): boolean {
  return /^file:\/\//i.test(value);
}

function stripTitleFromUrl(value: string): string {
  const trimmed = value.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return trimmed;
  return trimmed.slice(0, spaceIndex);
}

function resolveLocalPath(raw: string): string {
  if (isFileUrl(raw)) {
    return fileURLToPath(raw);
  }
  const normalized = raw.replace(/^attachment:\/\//i, "").replace(/^MEDIA:/i, "");
  if (path.isAbsolute(normalized)) return normalized;
  return path.resolve(process.cwd(), normalized);
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; fileName: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_UPLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download image: HTTP ${response.status} - ${errorText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const urlPath = new URL(url).pathname;
    const fileName = path.basename(urlPath) || "image";
    return { buffer, fileName };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readLocalImageBuffer(localPath: string): Promise<{ buffer: Buffer; fileName: string }> {
  const buffer = await fsPromises.readFile(localPath);
  const fileName = path.basename(localPath) || "image";
  return { buffer, fileName };
}

async function uploadFeishuImage(params: {
  cfg: FeishuConfig;
  buffer: Buffer;
  fileName: string;
}): Promise<string> {
  const { cfg, buffer, fileName } = params;
  const client = createFeishuClientFromConfig(cfg) as unknown as {
    domain?: string;
    tokenManager?: { getTenantAccessToken: () => Promise<string> };
  };

  const tokenManager = client.tokenManager;
  if (!tokenManager?.getTenantAccessToken) {
    throw new Error("Feishu token manager not available for image upload");
  }

  const token = await tokenManager.getTenantAccessToken();
  const domain = client.domain ?? "https://open.feishu.cn";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_UPLOAD_TIMEOUT_MS);

  try {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    formData.append("image", blob, fileName);
    formData.append("image_type", "message");

    const response = await fetch(`${domain}/open-apis/im/v1/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Feishu image upload failed: HTTP ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as {
      code?: number;
      msg?: string;
      data?: { image_key?: string };
    };

    if (data.code && data.code !== 0) {
      throw new Error(`Feishu image upload failed: ${data.msg ?? "unknown error"} (code: ${data.code})`);
    }

    const imageKey = data.data?.image_key;
    if (!imageKey) {
      throw new Error("Feishu image upload failed: no image_key returned");
    }

    return imageKey;
  } finally {
    clearTimeout(timeoutId);
  }
}

type ImageMatch = {
  index: number;
  length: number;
  alt: string;
  src: string;
};

function nextImageMatch(text: string, fromIndex: number): ImageMatch | null {
  MARKDOWN_LINKED_IMAGE_RE.lastIndex = fromIndex;
  MARKDOWN_IMAGE_RE.lastIndex = fromIndex;
  HTML_IMAGE_RE.lastIndex = fromIndex;

  const linkedMatch = MARKDOWN_LINKED_IMAGE_RE.exec(text);
  const mdMatch = MARKDOWN_IMAGE_RE.exec(text);
  const htmlMatch = HTML_IMAGE_RE.exec(text);

  if (!linkedMatch && !mdMatch && !htmlMatch) return null;

  const candidates = [
    linkedMatch
      ? { kind: "linked", index: linkedMatch.index, match: linkedMatch }
      : null,
    mdMatch ? { kind: "md", index: mdMatch.index, match: mdMatch } : null,
    htmlMatch ? { kind: "html", index: htmlMatch.index, match: htmlMatch } : null,
  ].filter(Boolean) as Array<{ kind: "linked" | "md" | "html"; index: number; match: RegExpExecArray }>;

  candidates.sort((a, b) => a.index - b.index);
  const winner = candidates[0];

  if (winner.kind === "linked") {
    return {
      index: winner.match.index,
      length: winner.match[0].length,
      alt: winner.match[1] ?? "",
      src: winner.match[2] ?? "",
    };
  }

  if (winner.kind === "md") {
    return {
      index: winner.match.index,
      length: winner.match[0].length,
      alt: winner.match[1] ?? "",
      src: winner.match[2] ?? "",
    };
  }

  const src = winner.match?.[1] ?? winner.match?.[2] ?? winner.match?.[3] ?? "";
  const altMatch = winner.match?.[0].match(/\balt\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
  const alt = altMatch?.[1] ?? altMatch?.[2] ?? altMatch?.[3] ?? "";
  return {
    index: winner.match?.index ?? 0,
    length: winner.match?.[0].length ?? 0,
    alt,
    src,
  };
}

async function buildMarkdownCardWithImages(params: {
  cfg: FeishuConfig;
  text: string;
}): Promise<Record<string, unknown>> {
  const { cfg, text } = params;

  const elements: Array<Record<string, unknown>> = [];
  let lastIndex = 0;
  let match: ImageMatch | null;

  while ((match = nextImageMatch(text, lastIndex)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before.trim()) {
      elements.push({ tag: "markdown", content: before });
    }

    const src = stripTitleFromUrl(match.src);
    try {
      const { buffer, fileName } = isHttpUrl(src)
        ? await fetchImageBuffer(src)
        : await readLocalImageBuffer(resolveLocalPath(src));
      const imageKey = await uploadFeishuImage({ cfg, buffer, fileName });
      elements.push({
        tag: "img",
        img_key: imageKey,
        alt: {
          tag: "plain_text",
          content: match.alt || "image",
        },
      });
    } catch {
      // Fallback: keep a safe link instead of breaking the card
      const fallback = match.alt ? `[${match.alt}](${src})` : src;
      elements.push({ tag: "markdown", content: fallback });
    }

    lastIndex = match.index + match.length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining.trim()) {
    elements.push({ tag: "markdown", content: remaining });
  }

  if (elements.length === 0) {
    elements.push({ tag: "markdown", content: text });
  }

  return {
    config: {
      wide_screen_mode: true,
    },
    elements,
  };
}
