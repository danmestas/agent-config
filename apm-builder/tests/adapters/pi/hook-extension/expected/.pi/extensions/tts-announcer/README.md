# tts-announcer (Pi extension scaffold)

Announces task completion via TTS

This is an **auto-generated TypeScript extension** for the Pi coding agent.
Source: `tts-announcer` (type: hook) from the agent-skills monorepo.

## Manual install step required

Pi extensions need a runtime. After this scaffold is emitted, you must run:

```bash
cd .pi/extensions/tts-announcer
npm install
```

Then register the extension in `.pi/settings.json`:

```json
{
  "extensions": [".pi/extensions/tts-announcer/index.ts"]
}
```

## Customizing

The scaffold registers each Pi event from the source SKILL.md's `hooks:` block.
Edit `index.ts` to change the behavior. The original shell scripts (if any)
should be placed under `hooks/` next to `index.ts` and will be invoked via
`spawn`.

## Why TypeScript?

Pi hooks are programmatic, not JSON-configured. The Pi `ExtensionAPI` exposes
events like `turn_end`, `post_tool_use`, `session_start`, etc. — see
[pi-coding-agent docs](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent#extensions).
