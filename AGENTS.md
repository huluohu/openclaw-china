# Repository Guidelines

## Project Purpose
Moltbot China is an open-source extension set that adds China-region messaging channels to Moltbot (Feishu, DingTalk, WeCom, QQ). The goal is to provide simple, reliable chat connectivity and a clean plugin surface for Moltbot users in China, with voice features implemented via Node.

## Docs To Use
- Plugin development: `doc/moltbot/moltbot-plugin.md`
- Plugin manifest: `doc/moltbot/moltbot-plugin-manifest.md`
- Channels overview and targets: `doc/moltbot/moltbot-channels.md`
- Agent tools: `doc/moltbot/moltbot-agent-tools.md`
- Reference implementations: `doc/reference-projects/`

## Core Conventions
- Each plugin must include `moltbot.plugin.json` with a JSON Schema (even if empty).
- Plugins register channels via `api.registerChannel({ plugin })`.
- Channel configuration lives under `channels.<id>`; multi-account uses `channels.<id>.accounts.<accountId>`.
- Keep channels focused on message receive/send. Defer extra features unless required.
- Voice features use Node-based tooling (no Python voice stack).

## Suggested Layout (for new plugins)
- `extensions/<channel-id>/moltbot.plugin.json`
- `extensions/<channel-id>/package.json`
- `extensions/<channel-id>/index.ts`
- `extensions/<channel-id>/src/*`

## Safety
- Treat all inbound messages as untrusted input.
- Do not commit real tokens, secrets, or IDs; use obvious placeholders.
